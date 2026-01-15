import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Canonical API base URL resolver (single source of truth).
 *
 * Convention:
 * - Returned URL ALWAYS ends with `/api`
 * - Prefer `EXPO_PUBLIC_API_URL` for explicit configuration
 * - In dev, try to auto-detect the dev machine LAN IP for physical devices
 */
export function resolveApiBaseUrl(): string {
  const env = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (env) return env.replace(/\/$/, "");

  if (!__DEV__) return "https://nubian-lne4.onrender.com/api";

  // Try to infer the packager host for LAN devices.
  // Examples:
  // - "192.168.1.10:8081" / "192.168.1.10:19000" / "10.0.2.2:19000"
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    "";

  const host = String(hostUri).split(":")[0]?.trim();

  // On Android emulator, 10.0.2.2 is usually correct.
  // On physical devices, use the inferred LAN IP if available.
  if (Platform.OS === "android") {
    if (host && host !== "localhost" && host !== "127.0.0.1") return `http://${host}:5000/api`;
    return "http://10.0.2.2:5000/api";
  }

  // iOS simulator & web can use localhost in dev
  return host && host !== "localhost" && host !== "127.0.0.1" ? `http://${host}:5000/api` : "http://localhost:5000/api";
}

