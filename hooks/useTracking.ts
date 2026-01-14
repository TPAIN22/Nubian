import { useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import axiosInstance from "@/utils/axiosInstans";

const SESSION_ID_KEY = "tracking_session_id";
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export interface TrackingPayload {
  productId?: string;
  categoryId?: string;
  storeId?: string;
  searchQuery?: string;
  screen?: string;
  scrollDepth?: number;
  filterType?: string;
  filterValue?: string;
  recommendationType?: string;
  bannerId?: string;
  price?: number;
  quantity?: number;
  orderId?: string;
  [key: string]: any;
}

type StoredSession = {
  sessionId: string;
  timestamp: number;
};

/** Get or create a session ID for tracking */
const getSessionId = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      const parsed: StoredSession = JSON.parse(stored);
      if (parsed?.sessionId && parsed?.timestamp) {
        // session valid؟
        if (Date.now() - parsed.timestamp < SESSION_EXPIRY_MS) {
          return parsed.sessionId;
        }
      }
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const toStore: StoredSession = { sessionId: newSessionId, timestamp: Date.now() };
    await AsyncStorage.setItem(SESSION_ID_KEY, JSON.stringify(toStore));
    return newSessionId;
  } catch {
    // fallback: no storage
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
};

const getDeviceInfo = (): string => {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
};

export const useTracking = () => {
  const { userId } = useAuth();

  const trackEvent = useCallback(
    async (eventName: string, payload: TrackingPayload = {}) => {
      try {
        const sessionId = await getSessionId();
        const device = getDeviceInfo();
        const screen = payload.screen || "unknown";

        const eventData = {
          event: eventName,
          userId: userId || null,
          sessionId,
          productId: payload.productId || null,
          categoryId: payload.categoryId || null,
          storeId: payload.storeId || null,
          searchQuery: payload.searchQuery || null,
          screen,
          timestamp: new Date().toISOString(),
          device,
          ...payload,
        };

        // remove undefined values (keep nulls)
        const cleanEventData = Object.fromEntries(
          Object.entries(eventData).filter(([, value]) => value !== undefined)
        );

        // Fire-and-forget (never block UI)
        axiosInstance.post("/tracking/event", cleanEventData).catch((err: any) => {
          if (__DEV__) console.warn("Tracking error:", err?.message || err);
        });

        if (__DEV__) {
          console.log("📊 Tracking event:", eventName, cleanEventData);
        }
      } catch (err) {
        if (__DEV__) console.warn("Tracking error:", err);
      }
    },
    [userId] // ✅ مهم: شيل getToken لأنه غير مستخدم وكان سبب infinity
  );

  const mergeSession = useCallback(async () => {
    if (!userId) return;

    try {
      const stored = await AsyncStorage.getItem(SESSION_ID_KEY);
      if (!stored) return;

      const parsed: StoredSession = JSON.parse(stored);
      if (!parsed?.sessionId) return;

      // notify backend to merge
      axiosInstance
        .post("/tracking/merge-session", {
          sessionId: parsed.sessionId,
          userId,
        })
        .catch(() => {});
    } catch (err) {
      if (__DEV__) console.warn("Session merge error:", err);
    }
  }, [userId]);

  return { trackEvent, mergeSession };
};

export default useTracking;
