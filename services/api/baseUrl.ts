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
  // Check for explicit API URL first (works in both dev and prod)
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitUrl) {
    // Ensure it ends with /api/
    const baseUrl = explicitUrl.endsWith('/api') ? explicitUrl : `${explicitUrl}/api`;
    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  if (!__DEV__) return "https://nubian-auth.onrender.com/api/";

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
    return "http://10.0.2.2/api";
  }

  // iOS: prefer detected LAN IP, fallback to localhost for simulator only
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:5000/api`;
  }

  // For iOS, we need to distinguish between physical devices and simulators
  // Physical devices cannot reach localhost - they need the dev machine's LAN IP
  // Simulators can use localhost

  // Check if we're in an iOS simulator (more reliable detection)
  const isSimulator = Platform.OS === "ios" && Constants.executionEnvironment !== "bare" &&
    (Constants as any)?.platform?.ios?.model?.includes("Simulator");

  if (isSimulator) {
    // iOS simulator can use localhost
    return "http://localhost:5000/api";
  }

  // Physical iOS device: localhost won't work
  // Try to infer LAN IP from various sources, or provide helpful error
  console.warn(
    "iOS Physical Device: localhost won't work. " +
    "Set EXPO_PUBLIC_API_URL to your dev machine's IP (e.g., EXPO_PUBLIC_API_URL=http://192.168.1.100/api)"
  );

  // As a last resort, try localhost anyway (might work if connected via USB/networking)
  // But this will likely fail - the warning above should guide the developer
  return "http://localhost:5000/api";
}

