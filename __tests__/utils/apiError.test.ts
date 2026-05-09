import { classifyError, describeError } from "@/utils/apiError";

// i18n.t falls through to keys when not loaded; that's fine for these checks.
const makeAxiosError = (status: number, body?: any) => {
  const err: any = new Error("server said no");
  err.response = { status, data: body };
  return err;
};

describe("apiError.classifyError", () => {
  it("classifies network failures (no response)", () => {
    const err: any = new Error("Network Error");
    err.code = "ERR_NETWORK";
    expect(classifyError(err).kind).toBe("network");
  });

  it("classifies timeouts (no response, ECONNABORTED)", () => {
    const err: any = new Error("timeout of 15000ms exceeded");
    err.code = "ECONNABORTED";
    expect(classifyError(err).kind).toBe("timeout");
  });

  it("classifies 401 / 403 as auth", () => {
    expect(classifyError(makeAxiosError(401)).kind).toBe("auth");
    expect(classifyError(makeAxiosError(403)).kind).toBe("auth");
  });

  it("classifies 404 as notFound", () => {
    expect(classifyError(makeAxiosError(404)).kind).toBe("notFound");
  });

  it("classifies 400 / 422 as validation, preferring server message", () => {
    const r = classifyError(
      makeAxiosError(422, { error: { message: "phone is required" } })
    );
    expect(r.kind).toBe("validation");
    expect(r.message).toBe("phone is required");
  });

  it("classifies 429 as rateLimited", () => {
    expect(classifyError(makeAxiosError(429)).kind).toBe("rateLimited");
  });

  it("classifies 5xx as server", () => {
    expect(classifyError(makeAxiosError(500)).kind).toBe("server");
    expect(classifyError(makeAxiosError(503)).kind).toBe("server");
  });

  it("falls back to unknown when no status and no offline indicator", () => {
    const err: any = new Error("???");
    err.response = { status: 418 }; // teapot, not in our buckets
    expect(classifyError(err).kind).toBe("unknown");
  });

  it("describeError returns the localized message string", () => {
    const msg = describeError(
      makeAxiosError(422, { error: { message: "address required" } })
    );
    expect(msg).toBe("address required");
  });
});
