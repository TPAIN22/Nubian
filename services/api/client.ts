import axios from "axios";
import { getToken, getAuthSnapshot, hasTokenGetter } from "@/utils/tokenManager";
import { resolveApiBaseUrl } from "@/services/api/baseUrl";

// Serialize axios `config.params` into a query string.
// Axios normally turns `{ params }` into `?a=b` *inside its default adapter*.
// The custom fetch adapter below replaces that adapter, so without this every
// request that passed `params` (category filter, pagination, currencyCode, …)
// went out with the query string silently dropped.
function appendQueryParams(url: string, params: any): string {
  if (!params || typeof params !== "object") return url;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) qs.append(key, String(v));
      });
    } else {
      qs.append(key, String(value));
    }
  }

  const serialized = qs.toString();
  if (!serialized) return url;
  return url + (url.includes("?") ? "&" : "?") + serialized;
}

/**
 * An axios-shaped cancellation error.
 *
 * Cancellation must not look like a failure: `axios.isCancel()` keys off
 * `__CANCEL__`, and the response interceptor below skips its 401-retry and
 * message-rewriting for anything without a `response`. Callers that abort a
 * superseded request therefore get a quiet, distinguishable rejection instead
 * of a spurious "network error".
 */
function canceledError(config: any) {
  const err: any = new Error("canceled");
  err.name = "CanceledError";
  err.code = "ERR_CANCELED";
  err.config = config;
  err.isAxiosError = true;
  err.__CANCEL__ = true;
  return err;
}

// Custom fetch adapter to fix Android SSL/TLS issues with Render
// This bypasses the old XMLHttpRequest implementation
const fetchAdapter = async (config: any) => {
  // Axios separates baseURL and url, but fetch needs the full URL
  let fullUrl = config.url;
  if (config.baseURL && !fullUrl.startsWith('http')) {
    fullUrl = `${config.baseURL}${fullUrl}`.replace(/([^:]\/)\/+/g, "$1"); // remove double slashes
  }
  // Axios serializes `config.params` inside its default adapter, which we've
  // replaced — so do it here or the query string is lost.
  fullUrl = appendQueryParams(fullUrl, config.params);

  // Axios wires `config.signal` into the request inside its *default* adapters.
  // Replacing the adapter means doing it here — without this, every
  // AbortController in the app (debounced search, superseded reverse-geocode
  // lookups, unmounted screens) is decorative: the request runs to completion
  // regardless, burning the caller's rate-limit budget and, upstream of it,
  // billed geocoding quota.
  const callerSignal: AbortSignal | undefined = config.signal;

  // Already aborted before we got here — never open the socket at all.
  if (callerSignal?.aborted) throw canceledError(config);

  const controller = new AbortController();
  const timeoutId = config.timeout
    ? setTimeout(() => controller.abort(), config.timeout)
    : null;

  const onCallerAbort = () => controller.abort();

  if (callerSignal) {
    // React Native's AbortSignal is an EventTarget; the `onabort` branch is a
    // safety net for runtimes shipping the older shape.
    if (typeof callerSignal.addEventListener === "function") {
      callerSignal.addEventListener("abort", onCallerAbort);
    } else {
      (callerSignal as any).onabort = onCallerAbort;
    }
  }

  // Idempotent: called on both the success and failure paths.
  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (!callerSignal) return;
    if (typeof callerSignal.removeEventListener === "function") {
      callerSignal.removeEventListener("abort", onCallerAbort);
    } else if ((callerSignal as any).onabort === onCallerAbort) {
      (callerSignal as any).onabort = null;
    }
  };

  try {
    const response = await fetch(fullUrl, {
      method: config.method.toUpperCase(),
      headers: config.headers,
      body: config.data,
      signal: controller.signal,
    });

    cleanup();

    const responseText = await response.text();
    let responseData: any = responseText;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Keep as text if not JSON
    }

    const axiosResponse = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      request: null,
    };

    const validateStatus = config.validateStatus || ((s: number) => s >= 200 && s < 300);
    if (!validateStatus(response.status)) {
      const serverMsg =
        (responseData && typeof responseData === "object" && (responseData.error?.message || responseData.message)) ||
        `Request failed with status code ${response.status}`;
      const err: any = new Error(serverMsg);
      err.config = config;
      err.code = response.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST";
      err.response = axiosResponse;
      err.request = null;
      err.isAxiosError = true;
      throw err;
    }

    return axiosResponse;
  } catch (error: any) {
    cleanup();
    if (error.name === 'AbortError') {
      // Both the caller's abort and our own timeout land here as the same
      // AbortError. Only the timeout is a genuine failure — the caller walking
      // away must not be reported as "the server took too long".
      if (callerSignal?.aborted) throw canceledError(config);

      const timeoutError = new Error('timeout of ' + config.timeout + 'ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      (timeoutError as any).config = config;
      throw timeoutError;
    }
    throw error;
  }
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  adapter: fetchAdapter as any, // Use our custom adapter
  withCredentials: true,
  timeout: 15_000,
  headers: { 
    "Content-Type": "application/json",
    "User-Agent": "NubianApp/1.0"
  },
});

// Wait until the persisted currency store has rehydrated from AsyncStorage before
// allowing the first request out the door. Without this, the very first money-
// bearing fetch (Home on cold start) goes out with no currency header, the
// backend returns USD numbers, and the formatter wraps them in the user's symbol.
let hydrationPromise: Promise<void> | null = null;
function awaitCurrencyHydration() {
  const { useCurrencyStore } = require("@/store/useCurrencyStore");
  if (useCurrencyStore.getState().isLoaded) return Promise.resolve();
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = new Promise<void>((resolve) => {
    const unsub = useCurrencyStore.subscribe(
      (state: any) => state.isLoaded,
      (loaded: boolean) => {
        if (loaded) {
          unsub();
          resolve();
        }
      }
    );
    // Safety net: never block the app indefinitely if persist never reports.
    setTimeout(() => {
      try { unsub(); } catch {}
      resolve();
    }, 1500);
  });
  return hydrationPromise;
}

// How long a request may wait for a Clerk token before giving up and going out
// unauthenticated.
//
// GUEST is deliberately tiny: Clerk can take 30s+ to hydrate on a cold start,
// and home/categories/products all work fine without auth, so a slow SDK must
// never hold up first paint.
//
// SIGNED_IN is generous because the trade-off inverts completely. Clerk session
// tokens live ~60s; once the cached one expires `getToken()` does a network
// round-trip to refresh it. Under the old flat 500ms cap that refresh regularly
// lost the race, the request went out with NO Authorization header, the backend
// answered 401, and callers read that as "you have no data" — which is how a
// minute spent on the checkout screen came back to an empty cart.
const GUEST_TOKEN_TIMEOUT_MS = 500;
const SIGNED_IN_TOKEN_TIMEOUT_MS = 10_000;

function resolveToken(): Promise<string | null> {
  const { isLoaded, isSignedIn } = getAuthSnapshot();
  // Only wait the long budget when Clerk has actually confirmed a session.
  // While it's still loading we stay on the short budget and let the 401 retry
  // below recover, rather than stalling every cold-start request.
  const budgetMs =
    isLoaded && isSignedIn ? SIGNED_IN_TOKEN_TIMEOUT_MS : GUEST_TOKEN_TIMEOUT_MS;

  return Promise.race<string | null>([
    getToken(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), budgetMs)),
  ]);
}

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Block the request until currency rehydrates so x-currency is always set.
      await awaitCurrencyHydration();

      const token = await resolveToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Inject currency and country from store
      // We use require to avoid circular dependency if useCurrencyStore imports apiClient
      const { useCurrencyStore } = require("@/store/useCurrencyStore");
      const { currencyCode, countryCode } = useCurrencyStore.getState();

      if (currencyCode) {
        config.headers['x-currency'] = currencyCode;
      }
      if (countryCode) {
        config.headers['x-country'] = countryCode;
      }

      if (__DEV__) {
        console.log("API Request:", {
          method: config.method?.toUpperCase(),
          baseURL: config.baseURL,
          url: config.url,
          headers: config.headers,
        });
      }
    } catch (error) {
      if (__DEV__) console.warn("Token retrieval failed:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response normalization
//
// The backend speaks TWO dialects:
//   1. Standard envelope (lib/response.js `sendSuccess`/`sendPaginated`):
//        { success: boolean, message, data, meta?, requestId, timestamp }
//      Used by orders, cart (get/add/coupon), products, categories list,
//      checkout, recommendations, home, etc.
//   2. Raw bodies: addresses (array + object), wishlist GET (array),
//      category-by-id (object), cart PUT /update (object), and bare
//      acknowledgements like `{ success: true }` / `{ success, message }`
//      that carry NO `data` field.
//
// Historically every call site coped on its own, and three *different* coping
// idioms had spread through the app, all reading off the SAME `response.data`:
//   (a) `res.data?.data ?? res.data`        (unwrap-or-fallback)
//   (b) `res.data.data`                      (assume-enveloped: location/ticket/
//                                             currency stores, coupon components)
//   (c) `res.data.meta.pagination` / `.total`(pagination off the envelope)
// Drift between these caused a real production bug. We centralize the unwrap so
// new code can simply read `response.data` as the payload — but we must do it
// WITHOUT breaking the many existing (b)/(c) call sites, several of which live
// in files outside this task's edit scope.
//
// Strategy: when (and ONLY when) a body carries the envelope signature, replace
// `response.data` with the inner `data`, then re-attach the envelope's own keys
// (`data` → self, `success`, `message`, `meta`) back onto that inner payload as
// NON-ENUMERABLE properties. Result:
//   • `response.data`            → the payload (clean path, idioms (a))
//   • `response.data.data`       → the payload again (keeps idiom (b) working)
//   • `response.data.success`    → true        (keeps `res.data.success && …` guards)
//   • `response.data.meta`       → meta        (keeps idiom (c) working)
//   • `response.meta`            → meta        (forward-looking path for owned files)
// Non-enumerable means these shims never leak into spreads, `JSON.stringify`,
// `Object.keys`, or deep-clones of the payload — and crucially the self-referential
// `data` won't create a serialization cycle. Raw arrays, raw objects, bare
// `{ success: true }` acks (no own `data`), and empty/204 bodies are passed
// through byte-for-byte; we never corrupt a raw payload.
function isStandardEnvelope(body: unknown): body is { success: boolean; data: unknown; meta?: unknown } {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    typeof (body as any).success === "boolean" &&
    // Own `data` property is the load-bearing discriminator: it's what separates
    // a real payload envelope from a bare `{ success: true }` acknowledgement.
    Object.prototype.hasOwnProperty.call(body, "data")
  );
}

function defineHidden(target: object, key: string, value: unknown) {
  try {
    Object.defineProperty(target, key, {
      value,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  } catch {
    // Frozen/sealed/exotic payloads can reject the property. The forward-looking
    // `response.meta` + `response.data` paths still hold, so this is non-fatal.
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response?.data;
    if (isStandardEnvelope(body)) {
      const inner = body.data;
      const meta = body.meta;

      response.data = inner;
      // Forward-looking accessor for the call sites this task owns.
      (response as any).meta = meta;

      // Back-compat shims for legacy idioms (b)/(c). Only attachable to a
      // non-null object/array payload; primitives just use `response.data`.
      if (inner !== null && typeof inner === "object") {
        // `res.data.data` → the payload itself, so `const x = res.data.data` and
        // `res.data.data.filter(...)` keep working after unwrapping.
        if (!Object.prototype.hasOwnProperty.call(inner, "data")) {
          defineHidden(inner, "data", inner);
        }
        // `res.data.success` / `res.data.message` for envelope-shape guards.
        if (!Object.prototype.hasOwnProperty.call(inner, "success")) {
          defineHidden(inner, "success", body.success);
        }
        if (
          (body as any).message !== undefined &&
          !Object.prototype.hasOwnProperty.call(inner, "message")
        ) {
          defineHidden(inner, "message", (body as any).message);
        }
        // `res.data.meta.pagination` / `res.data.meta.total` for legacy paging.
        if (meta != null && !Object.prototype.hasOwnProperty.call(inner, "meta")) {
          defineHidden(inner, "meta", meta);
        }
      }
    }
    return response;
  },
  async (error) => {
    // A 401 is ambiguous: it can mean "you are not logged in", but it can also
    // just mean this request left without an Authorization header because the
    // token refresh hadn't landed yet. Retry exactly once with a token we
    // actually waited for. If that still 401s, it's a real auth failure and
    // falls through to the normal error path.
    const config = error?.config;
    if (
      error?.response?.status === 401 &&
      config &&
      !config.__retriedWithFreshToken &&
      hasTokenGetter()
    ) {
      config.__retriedWithFreshToken = true;
      const token = await Promise.race<string | null>([
        getToken(),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), SIGNED_IN_TOKEN_TIMEOUT_MS)
        ),
      ]);
      if (token) {
        config.headers = { ...(config.headers ?? {}), Authorization: `Bearer ${token}` };
        if (__DEV__) console.log("API Retry after 401:", config.url);
        return apiClient.request(config);
      }
    }

    if (__DEV__) {
      console.log("API Error Details:", {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data
      });
    }

    if (!error?.response) {
      if (error?.code === "ECONNABORTED") {
        error.message = "Request timeout - the server took too long to respond";
      } else if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
        error.message = 'Network error - unable to connect to server || "unknown"';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

