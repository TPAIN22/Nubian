import i18n from "@/utils/i18n";

export type ApiErrorKind =
  | "network"
  | "timeout"
  | "auth"
  | "validation"
  | "notFound"
  | "rateLimited"
  | "server"
  | "unknown";

export type ClassifiedError = {
  kind: ApiErrorKind;
  status?: number;
  /** Localized, user-safe message. */
  message: string;
  /** Raw server-provided message (English/source) — for logs only. */
  rawMessage?: string;
  /** Field-level details if the server returned them (e.g. validators). */
  details?: unknown;
};

const t = (key: string, fallback: string): string => {
  const v = i18n.t(key);
  return v && v !== key ? v : fallback;
};

export function classifyError(e: any): ClassifiedError {
  const status: number | undefined = e?.response?.status;
  const data = e?.response?.data;
  const rawMessage: string | undefined =
    data?.error?.message || data?.message || e?.message;
  const details = data?.error?.details;

  // No response at all → network or timeout.
  if (!e?.response) {
    if (e?.code === "ECONNABORTED" || /timeout/i.test(String(e?.message ?? ""))) {
      return {
        kind: "timeout",
        message: t("error_timeout", "The server took too long to respond. Please try again."),
        rawMessage,
      };
    }
    return {
      kind: "network",
      message: t("error_network", "No internet connection. Check your network and try again."),
      rawMessage,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      status,
      message: t("error_auth", "Your session has expired. Please sign in again."),
      rawMessage,
      details,
    };
  }

  if (status === 404) {
    return {
      kind: "notFound",
      status,
      message: rawMessage || t("error_notFound", "We couldn't find what you were looking for."),
      rawMessage,
      details,
    };
  }

  if (status === 422 || status === 400) {
    // Prefer the server's actionable message; fall back to a generic one.
    return {
      kind: "validation",
      status,
      message: rawMessage || t("error_validation", "Please check your input and try again."),
      rawMessage,
      details,
    };
  }

  if (status === 429) {
    return {
      kind: "rateLimited",
      status,
      message: t("error_rateLimited", "You're going too fast. Please wait a moment and try again."),
      rawMessage,
      details,
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      kind: "server",
      status,
      message: t("error_server", "Something went wrong on our side. Please try again shortly."),
      rawMessage,
      details,
    };
  }

  return {
    kind: "unknown",
    status,
    message: rawMessage || t("error_unknown", "Something went wrong. Please try again."),
    rawMessage,
    details,
  };
}

/** Returns just the user-facing string. */
export function describeError(e: any): string {
  return classifyError(e).message;
}
