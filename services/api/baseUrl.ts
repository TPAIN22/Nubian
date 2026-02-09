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
/**
 * Helper to ensure the API URL is properly formatted for Axios.
 * Axios with relative paths (e.g. .get("home")) REQUIRES a trailing slash on baseURL.
 */
function ensureApiSuffix(url: string): string {
  let cleanUrl = url.trim();
  
  // Remove any trailing slashes for normalization
  while (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }

  // Ensure it ends with /api
  if (!cleanUrl.toLowerCase().endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }

  // Ensure return value ALWAYS ends with exactly one trailing slash
  return `${cleanUrl}/`;
}

export function resolveApiBaseUrl(): string {
  // 1. Explicit environment variable (highest priority)
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitUrl) {
    return ensureApiSuffix(explicitUrl);
  }

  // 2. Production fallback
  if (!__DEV__) {
    return ensureApiSuffix("https://nubian-lne4.onrender.com");
  }

  // 3. Development auto-detection
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    "";

  const host = String(hostUri).split(":")[0]?.trim();

  // Android emulator or physical device
  if (Platform.OS === "android") {
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return ensureApiSuffix(`http://${host}:5000`);
    }
    return ensureApiSuffix("http://10.0.2.2:5000");
  }

  // iOS Simulator or Physical device
  const isSimulator = Platform.OS === "ios" && Constants.executionEnvironment !== "bare" &&
    (Constants as any)?.platform?.ios?.model?.includes("Simulator");

  if (isSimulator) {
    return ensureApiSuffix("http://localhost:5000");
  }

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return ensureApiSuffix(`http://${host}:5000`);
  }

  // Fallback with warning for physical iOS
  console.warn(
    "iOS Physical Device: localhost won't work. " +
    "Set EXPO_PUBLIC_API_URL to your dev machine's IP (e.g., EXPO_PUBLIC_API_URL=http://192.168.1.100:5000)"
  );

  return ensureApiSuffix("http://localhost:5000");
}

