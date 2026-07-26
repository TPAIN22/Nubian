/**
 * Request cancellation through the custom fetch adapter (services/api/client.ts).
 *
 * Axios only honours `config.signal` inside its own adapters, so replacing the
 * adapter silently made every AbortController in the app decorative: the socket
 * stayed open, the response still landed, and the server still spent its
 * rate-limit (and billed geocoding) budget on an answer nobody wanted.
 *
 * These tests drive the REAL exported client with `global.fetch` mocked, so the
 * shipped adapter is what gets exercised — not a re-implementation.
 */

// jsdom lacks TextEncoder/TextDecoder, which Expo's winter runtime (pulled in
// transitively by the client module) requires. Polyfill before the lazy require.
import { TextEncoder, TextDecoder } from "util";
if (typeof (globalThis as any).TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder;
}
if (typeof (globalThis as any).TextDecoder === "undefined") {
  (globalThis as any).TextDecoder = TextDecoder as any;
}

jest.mock("@/services/api/baseUrl", () => ({
  __esModule: true,
  resolveApiBaseUrl: () => "https://test-api.com/api/",
}));
jest.mock("@/utils/tokenManager", () => ({
  __esModule: true,
  getToken: jest.fn().mockResolvedValue(null),
  getAuthSnapshot: jest.fn(() => ({ isLoaded: true, isSignedIn: false })),
  hasTokenGetter: jest.fn(() => false),
}));
// The request interceptor blocks until the currency store rehydrates; report it
// already hydrated so these tests measure the adapter, not a 1.5s safety net.
jest.mock("@/store/useCurrencyStore", () => ({
  __esModule: true,
  useCurrencyStore: {
    getState: () => ({ isLoaded: true, currencyCode: "SDG", countryCode: "SD" }),
    subscribe: () => () => {},
  },
}));

let apiClient: any;
beforeAll(() => {
  apiClient = require("@/services/api/client").default;
});

const originalFetch = global.fetch;
afterEach(() => {
  (global as any).fetch = originalFetch;
  jest.clearAllMocks();
});

/** Resolve once the mocked fetch has actually been entered. */
const untilCalled = async (mock: jest.Mock) => {
  for (let i = 0; i < 100 && mock.mock.calls.length === 0; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};

describe("fetch adapter — caller cancellation", () => {
  it("aborts the in-flight fetch when the caller's signal fires", async () => {
    let observed: AbortSignal | undefined;
    const mockFetch = jest.fn((_url: string, init: any) => {
      observed = init.signal;
      // Never settles on its own: only the abort can end this request.
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });
    (global as any).fetch = mockFetch;

    const controller = new AbortController();
    const pending = apiClient.get("/geo/reverse", { signal: controller.signal });

    await untilCalled(mockFetch);
    expect(observed!.aborted).toBe(false);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    // The point of the whole exercise: the request itself was cancelled, not
    // merely the promise abandoned while the socket ran to completion.
    expect(observed!.aborted).toBe(true);
  });

  it("rejects as canceled — never as a timeout — so callers can tell them apart", async () => {
    const mockFetch = jest.fn((_url: string, init: any) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      }),
    );
    (global as any).fetch = mockFetch;

    const controller = new AbortController();
    const pending = apiClient.get("/geo/search", { signal: controller.signal });
    await untilCalled(mockFetch);
    controller.abort();

    const error = await pending.catch((e: any) => e);
    expect(error.code).toBe("ERR_CANCELED");
    // `axios.isCancel()` keys off this, and the response interceptor's
    // ECONNABORTED / network-error rewrites must not claim this one.
    expect(error.__CANCEL__).toBe(true);
    expect(error.message).not.toMatch(/timeout/i);
  });

  it("never opens a socket for a signal that is already aborted", async () => {
    const mockFetch = jest.fn();
    (global as any).fetch = mockFetch;

    const controller = new AbortController();
    controller.abort();

    await expect(
      apiClient.get("/geo/reverse", { signal: controller.signal }),
    ).rejects.toMatchObject({ code: "ERR_CANCELED" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("still reports a real timeout as ECONNABORTED", async () => {
    const mockFetch = jest.fn((_url: string, init: any) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => {
          const err = new Error("Aborted");
          err.name = "AbortError";
          reject(err);
        });
      }),
    );
    (global as any).fetch = mockFetch;

    const error = await apiClient
      .get("/geo/reverse", { timeout: 20 })
      .catch((e: any) => e);

    expect(error.code).toBe("ECONNABORTED");
    expect(error.__CANCEL__).toBeUndefined();
  });

  it("leaves an uncancelled request alone", async () => {
    (global as any).fetch = jest.fn(async () => ({
      status: 200,
      statusText: "OK",
      headers: new Map(),
      text: async () => JSON.stringify({ success: true, data: { formattedAddress: "Khartoum" } }),
    }));

    const controller = new AbortController();
    const res = await apiClient.get("/geo/reverse", { signal: controller.signal });

    expect(res.status).toBe(200);
    expect(res.data.formattedAddress).toBe("Khartoum");

    // Aborting after the fact must not throw through the detached listener.
    expect(() => controller.abort()).not.toThrow();
  });
});
