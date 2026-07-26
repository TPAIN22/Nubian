/**
 * Response-normalization interceptor (services/api/client.ts).
 *
 * These tests drive the ACTUAL registered success interceptor (via
 * `apiClient.interceptors.response.handlers`) against representative backend
 * payloads, so the envelope-detection predicate and the back-compat shims are
 * verified against the real shipped code rather than a re-implementation.
 */

// jsdom doesn't define TextEncoder/TextDecoder, but Expo's winter runtime (pulled
// in transitively when the real client module loads) requires them. Polyfill from
// Node's `util` BEFORE requiring the client. ES `import` is hoisted, so the client
// is loaded lazily via `require` inside beforeAll — after the polyfill runs.
// Scoped to this test file so no shared jest.setup change is needed.
import { TextEncoder, TextDecoder } from "util";
if (typeof (globalThis as any).TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder;
}
if (typeof (globalThis as any).TextDecoder === "undefined") {
  (globalThis as any).TextDecoder = TextDecoder as any;
}

// The client module reads Platform/env at import time via baseUrl.ts and pulls in
// the Clerk-backed tokenManager. Neither is relevant to response normalization, so
// stub them to keep this suite focused on the interceptor (the real one is still
// exercised — only these leaf deps are mocked).
jest.mock("@/services/api/baseUrl", () => ({
  __esModule: true,
  resolveApiBaseUrl: () => "https://test-api.com/api",
}));
jest.mock("@/utils/tokenManager", () => ({
  __esModule: true,
  getToken: jest.fn().mockResolvedValue(null),
  // The client also asks how long it's allowed to wait for a token, and whether
  // a getter exists at all before retrying a 401. Default to "guest, loaded" so
  // the request path never blocks; individual tests override.
  getAuthSnapshot: jest.fn(() => ({ isLoaded: true, isSignedIn: false })),
  hasTokenGetter: jest.fn(() => true),
}));

import { getToken, hasTokenGetter } from "@/utils/tokenManager";

const mockedGetToken = getToken as jest.Mock;
const mockedHasTokenGetter = hasTokenGetter as jest.Mock;

let apiClient: any;
beforeAll(() => {
  apiClient = require("@/services/api/client").default;
});

type AxiosResponseLike = {
  data: any;
  status: number;
  statusText?: string;
  headers?: any;
  config?: any;
  meta?: any;
};

// Pull the fulfilled handler off the registered response interceptor.
function runResponseInterceptor(response: AxiosResponseLike): AxiosResponseLike {
  const handlers = (apiClient.interceptors.response as any).handlers as Array<{
    fulfilled: (r: AxiosResponseLike) => AxiosResponseLike;
  }>;
  const fulfilled = handlers.find((h) => h && typeof h.fulfilled === "function")?.fulfilled;
  if (!fulfilled) throw new Error("No fulfilled response interceptor registered");
  return fulfilled({ status: 200, ...response });
}

const make = (data: any): AxiosResponseLike => ({ data, status: 200 });

// Pull the rejected handler off the registered response interceptor.
function runErrorInterceptor(error: any): Promise<any> {
  const handlers = (apiClient.interceptors.response as any).handlers as Array<{
    rejected: (e: any) => Promise<any>;
  }>;
  const rejected = handlers.find((h) => h && typeof h.rejected === "function")?.rejected;
  if (!rejected) throw new Error("No rejected response interceptor registered");
  return rejected(error);
}

const authError = (config: any = { url: "/carts", method: "get" }) => ({
  isAxiosError: true,
  message: "Authentication required.",
  config,
  response: { status: 401, data: { error: { message: "Authentication required." } } },
});

describe("client response interceptor — envelope unwrapping", () => {
  it("unwraps a standard sendSuccess envelope to the inner data", () => {
    const inner = { _id: "p1", name: "Widget" };
    const res = runResponseInterceptor(
      make({ success: true, message: "ok", data: inner, requestId: "r1", timestamp: "t" })
    );
    expect(res.data).toEqual(inner);
    expect(res.data._id).toBe("p1");
  });

  it("hoists pagination meta to response.meta for sendPaginated", () => {
    const products = [{ _id: "p1" }, { _id: "p2" }];
    const pagination = { page: 2, limit: 20, total: 42, totalPages: 3 };
    const res = runResponseInterceptor(
      make({ success: true, data: products, meta: { pagination }, requestId: "r", timestamp: "t" })
    );
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(2);
    expect(res.meta?.pagination).toEqual(pagination);
  });

  it("keeps legacy res.data.meta.pagination reachable after unwrap", () => {
    const products = [{ _id: "p1" }];
    const pagination = { page: 1, limit: 20, total: 1, totalPages: 1 };
    const res = runResponseInterceptor(
      make({ success: true, data: products, meta: { pagination } })
    );
    // Back-compat shim: useItemStore / store/[id].tsx still read this path.
    expect((res.data as any).meta?.pagination).toEqual(pagination);
    expect((res.data as any).meta?.total).toBeUndefined();
  });

  it("keeps legacy res.data.data and res.data.success reachable after unwrap", () => {
    const inner = { validation: { valid: true }, coupon: { code: "SAVE10" } };
    const res = runResponseInterceptor(make({ success: true, data: inner }));
    // Coupon components guard with `res.data.success && res.data.data`.
    expect((res.data as any).success).toBe(true);
    expect((res.data as any).data).toBe(res.data); // self-ref → the payload
    expect((res.data as any).data.validation.valid).toBe(true);
  });

  it("does not leak shim keys into enumeration / JSON of the payload", () => {
    const inner = { _id: "p1", name: "Widget" };
    const res = runResponseInterceptor(
      make({ success: true, data: inner, meta: { pagination: { page: 1 } } })
    );
    expect(Object.keys(res.data).sort()).toEqual(["_id", "name"]);
    // Self-referential `data` must not blow up serialization.
    expect(() => JSON.stringify(res.data)).not.toThrow();
    expect(JSON.parse(JSON.stringify(res.data))).toEqual(inner);
  });

  it("shims an unwrapped array without breaking iteration or length", () => {
    const arr = [{ _id: "a" }, { _id: "b" }];
    const res = runResponseInterceptor(
      make({ success: true, data: arr, meta: { pagination: { total: 2 } } })
    );
    expect(res.data).toHaveLength(2);
    expect((res.data as any).data).toBe(res.data);
    expect((res.data as any).meta?.pagination?.total).toBe(2);
    // Spreading the array must not pull in the non-enumerable shims.
    expect([...res.data]).toHaveLength(2);
    expect(Object.keys([...res.data])).toEqual(["0", "1"]);
  });
});

describe("client response interceptor — raw bodies are never corrupted", () => {
  it("leaves a raw array (addresses / wishlist) untouched", () => {
    const arr = [{ _id: "addr1" }, { _id: "addr2" }];
    const res = runResponseInterceptor(make(arr));
    expect(res.data).toBe(arr);
    expect((res.data as any).success).toBeUndefined();
  });

  it("leaves a raw object (category-by-id / cart PUT) untouched", () => {
    const obj = { _id: "c1", name: "Electronics" };
    const res = runResponseInterceptor(make(obj));
    expect(res.data).toBe(obj);
  });

  it("leaves a bare { success: true } acknowledgement untouched (no own data)", () => {
    const ack = { success: true };
    const res = runResponseInterceptor(make(ack));
    expect(res.data).toBe(ack);
    expect(res.data).toEqual({ success: true });
  });

  it("leaves a { success, message } acknowledgement (wishlist add/remove) untouched", () => {
    const ack = { success: true, message: "Product added to wishlist" };
    const res = runResponseInterceptor(make(ack));
    expect(res.data).toBe(ack);
    expect((res.data as any).data).toBeUndefined();
  });

  it("leaves an empty/204-style body untouched", () => {
    const res = runResponseInterceptor(make(undefined));
    expect(res.data).toBeUndefined();
  });

  it("does not unwrap an error-shaped body ({ success:false, error })", () => {
    const errBody = { success: false, error: { code: "X", message: "bad" } };
    const res = runResponseInterceptor(make(errBody));
    // No own `data` key → left as-is.
    expect(res.data).toBe(errBody);
  });

  it("preserves a real own `data` field on the unwrapped payload (no clobber)", () => {
    const inner = { _id: "o1", data: "genuine-field" };
    const res = runResponseInterceptor(make({ success: true, data: inner }));
    expect((res.data as any).data).toBe("genuine-field");
  });
});

/**
 * A 401 is ambiguous. It can mean "not logged in", but it can equally mean the
 * request left without an `Authorization` header because Clerk's ~60s session
 * token was mid-refresh. Treating the second case as the first is what emptied
 * the cart when a user came back from checkout, so the interceptor retries once
 * with a token it actually waited for.
 */
describe("client response interceptor — 401 retry", () => {
  it("retries once with a fresh token and returns that response", async () => {
    mockedGetToken.mockResolvedValueOnce("fresh-jwt");
    const requestSpy = jest
      .spyOn(apiClient, "request")
      .mockResolvedValue({ status: 200, data: { _id: "cart1" } } as any);

    const error = authError();
    const res = await runErrorInterceptor(error);

    expect(requestSpy).toHaveBeenCalledTimes(1);
    const retriedConfig = requestSpy.mock.calls[0]![0] as any;
    expect(retriedConfig.headers.Authorization).toBe("Bearer fresh-jwt");
    // The guard flag must be stamped so the retry can't retry itself.
    expect(retriedConfig.__retriedWithFreshToken).toBe(true);
    expect(res.data).toEqual({ _id: "cart1" });
  });

  it("does not retry a request that already retried", async () => {
    mockedGetToken.mockResolvedValue("fresh-jwt");
    const requestSpy = jest.spyOn(apiClient, "request");

    const error = authError({ url: "/carts", __retriedWithFreshToken: true });

    await expect(runErrorInterceptor(error)).rejects.toBe(error);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("does not retry when no token can be obtained (a genuine guest 401)", async () => {
    mockedGetToken.mockResolvedValueOnce(null);
    const requestSpy = jest.spyOn(apiClient, "request");

    const error = authError();

    await expect(runErrorInterceptor(error)).rejects.toBe(error);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("does not retry when there is no token getter registered", async () => {
    mockedHasTokenGetter.mockReturnValueOnce(false);
    const requestSpy = jest.spyOn(apiClient, "request");

    const error = authError();

    await expect(runErrorInterceptor(error)).rejects.toBe(error);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("leaves non-401 failures alone", async () => {
    const requestSpy = jest.spyOn(apiClient, "request");
    const error: any = {
      isAxiosError: true,
      config: { url: "/carts" },
      response: { status: 500, data: { message: "server exploded" } },
    };

    await expect(runErrorInterceptor(error)).rejects.toBe(error);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it("still normalizes transport failures that have no response", async () => {
    const error: any = { isAxiosError: true, code: "ECONNABORTED", config: { url: "/carts" } };

    await expect(runErrorInterceptor(error)).rejects.toBe(error);
    expect(error.message).toMatch(/timeout/i);
  });
});
