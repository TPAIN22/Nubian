import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { useAuth } from "@clerk/clerk-expo";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  registerPushTokenWithAuth,
} from "@/utils/pushToken";
import {
  canShowSoftPrompt,
  getPermissionStatus,
  type PushPermissionStatus,
  type SoftPromptReason,
} from "@/utils/pushPermission";
import { navigateFromNotificationLink } from "@/utils/deepLinks";
import { NotificationPermissionSheet } from "@/components/notifications/NotificationPermissionSheet";

// Foreground display policy — runs at module load so it's installed before the
// first push arrives. Without this, expo-notifications defaults (SDK 53+) hide
// the banner when the app is in the foreground, so users with the app open
// silently miss pushes even though our listener fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type NotificationContextType = {
  expoPushToken: string | null;
  permissionStatus: PushPermissionStatus;
  /**
   * Show the soft-prompt sheet if cooldown and OS state allow.
   * Returns true when the sheet was shown.
   */
  promptIfAppropriate: (reason?: SoftPromptReason) => Promise<boolean>;
  /**
   * Trigger the OS permission request immediately and, on grant, register the
   * Expo push token with the backend. Returns the final OS status.
   */
  requestAndRegister: () => Promise<PushPermissionStatus>;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  permissionStatus: "undetermined",
  promptIfAppropriate: async () => false,
  requestAndRegister: async () => "undetermined",
});

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PushPermissionStatus>("undetermined");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetReason, setSheetReason] = useState<SoftPromptReason>("general");

  const { getToken, userId, isLoaded } = useAuth();
  const hasRegisteredToken = useRef(false);

  // -- Deep-link navigation on notification tap -------------------------------
  // Routing lives in utils/deepLinks so the foreground handler and the in-app
  // inbox screen always navigate to the same destination for a given link.
  const handleNotificationResponse = useCallback((response: any) => {
    console.log("👆 Notification tapped:", {
      title: response.notification.request.content.title,
      data: response.notification.request.content.data,
    });

    const deepLink = response.notification.request.content.data?.deepLink;
    navigateFromNotificationLink(typeof deepLink === "string" ? deepLink : null);
  }, []);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📬 Notification received:", {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
      },
    );
    const response = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => {
      received.remove();
      response.remove();
    };
  }, [handleNotificationResponse]);

  // -- Token registration (only when permission already granted) -------------
  const registerToken = useCallback(async (): Promise<void> => {
    if (hasRegisteredToken.current) return;

    try {
      if (userId) {
        const authToken = await getToken();
        if (authToken) {
          const token = await registerPushTokenWithAuth(authToken);
          if (token) {
            setExpoPushToken(token);
            hasRegisteredToken.current = true;
            return;
          }
        }
      }
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        hasRegisteredToken.current = true;
      }
    } catch (error) {
      console.error("❌ Error registering push token:", error);
    }
  }, [getToken, userId]);

  // Silent path: on mount and when auth state changes, check the OS status.
  // If already granted, register the token without any UI. If not, do nothing
  // until a caller invokes promptIfAppropriate() / requestAndRegister().
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      const status = await getPermissionStatus();
      if (cancelled) return;
      setPermissionStatus(status);
      if (status === "granted") {
        // If userId just changed (login), allow re-registration so the token
        // gets linked to the user account on the backend.
        hasRegisteredToken.current = false;
        await registerToken();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, registerToken]);

  // -- Public API ------------------------------------------------------------
  const requestAndRegister = useCallback(async (): Promise<PushPermissionStatus> => {
    const existing = await getPermissionStatus();
    let final: PushPermissionStatus = existing;
    if (existing === "undetermined") {
      const { status } = await Notifications.requestPermissionsAsync();
      final =
        status === "granted"
          ? "granted"
          : status === "denied"
            ? "denied"
            : "undetermined";
    }
    setPermissionStatus(final);
    if (final === "granted") {
      hasRegisteredToken.current = false;
      await registerToken();
    }
    return final;
  }, [registerToken]);

  const promptIfAppropriate = useCallback(
    async (reason: SoftPromptReason = "general"): Promise<boolean> => {
      const ok = await canShowSoftPrompt(reason);
      if (!ok) return false;
      setSheetReason(reason);
      setSheetVisible(true);
      return true;
    },
    [],
  );

  const dismissSheet = useCallback(() => setSheetVisible(false), []);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        permissionStatus,
        promptIfAppropriate,
        requestAndRegister,
      }}
    >
      {children}
      <NotificationPermissionSheet
        visible={sheetVisible}
        reason={sheetReason}
        onEnable={requestAndRegister}
        onDismiss={dismissSheet}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
