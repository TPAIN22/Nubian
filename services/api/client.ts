import axios from "axios";
import { getToken } from "@/utils/tokenManager";
import { resolveApiBaseUrl } from "@/services/api/baseUrl";

// Custom fetch adapter to fix Android SSL/TLS issues with Render
// This bypasses the old XMLHttpRequest implementation
const fetchAdapter = async (config: any) => {
  // Axios separates baseURL and url, but fetch needs the full URL
  let fullUrl = config.url;
  if (config.baseURL && !fullUrl.startsWith('http')) {
    fullUrl = `${config.baseURL}${fullUrl}`.replace(/([^:]\/)\/+/g, "$1"); // remove double slashes
  }

  const controller = new AbortController();
  const timeoutId = config.timeout 
    ? setTimeout(() => controller.abort(), config.timeout) 
    : null;

  try {
    const response = await fetch(fullUrl, {
      method: config.method.toUpperCase(),
      headers: config.headers,
      body: config.data,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData = responseText;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Keep as text if not JSON
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      request: null,
    };
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
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

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Block the request until currency rehydrates so x-currency is always set.
      await awaitCurrencyHydration();

      const token = await getToken();
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

