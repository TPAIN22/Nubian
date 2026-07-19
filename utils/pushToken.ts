import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import i18n from "@/utils/i18n";

// Push-token HTTP goes through the shared apiClient so it inherits the Clerk
// bearer token (when available), x-currency/x-country headers, timeout, and the
// custom fetch adapter. apiClient's baseURL already ends in `/api/`, so the path
// is passed WITHOUT a leading slash. Token registration is fire-and-forget:
// network/HTTP failures are swallowed and we still return the Expo token.
import apiClient from "@/services/api/client";

/**
 * Enhanced push token registration with new notification system
 * Supports anonymous tokens (allowAnonymous: true)
 * Supports multi-device (multiDevice: true)
 * Auto-cleanup handled by backend (autoCleanup: true)
 */
export async function registerForPushNotificationsAsync(_userId?: string | null) {
  try {
    if (!Device.isDevice) {
      alert(i18n.t('pushNotificationsDeviceOnly'));
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert(i18n.t('pushNotificationsPermissionDenied'));
      return null;
    }

    // Get Expo push token with proper error handling
    let tokenResponse;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        console.error('❌ Expo projectId is missing. Check app.json configuration.');
        alert(i18n.t('pushNotificationsConfigError') || 'Push notifications configuration error. Please contact support.');
        return null;
      }
      tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    } catch (error: any) {
      console.error('❌ Failed to get Expo push token:', error);
      if (error.code === 'E_MISSING_PERMISSIONS') {
        alert(i18n.t('pushNotificationsPermissionDenied'));
      } else if (error.code === 'E_NOT_DEVICE') {
        alert(i18n.t('pushNotificationsDeviceOnly'));
      } else {
        alert(i18n.t('pushNotificationsTokenError') || 'Failed to register for push notifications. Please try again.');
      }
      return null;
    }

    if (!tokenResponse?.data) {
      console.error('❌ Invalid token response from Expo:', tokenResponse);
      alert(i18n.t('pushNotificationsTokenError') || 'Invalid push token response. Please try again.');
      return null;
    }

    const token = tokenResponse.data;

    // Get device info
    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
    const deviceName = Device.modelName || Device.deviceName || 'Unknown Device';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const osVersion = `${Platform.OS} ${Device.osVersion || ''}`.trim();

    // Send token to the API. The request interceptor attaches the Clerk token
    // automatically when the user is signed in; anonymous tokens are allowed by
    // the backend, so an unauthenticated request is fine too.
    try {
      await apiClient.post("notifications/tokens", {
        token,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        deviceId,
        deviceName,
        appVersion,
        osVersion,
      });
    } catch (error) {
      console.error('Failed to save push token:', error);
      // Don't fail completely - token registration is fire-and-forget
      return token;
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        description: 'Default notification channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        // Omit `sound` so the channel uses the system default notification
        // sound. Passing the string 'default' makes expo-notifications look for
        // a bundled custom sound file named "default" (which we don't ship),
        // throwing: "Custom sound 'default' not found in native app".
        enableVibrate: true,
        showBadge: true,
      });
    }

    console.log('✅ Push token registered successfully');
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Register push token with authentication (for logged-in users)
 * This will merge anonymous tokens when user logs in (onLoginMerge: true)
 */
export async function registerPushTokenWithAuth(authToken: string) {
  try {
    if (!Device.isDevice) {
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permission not granted; skipping token registration');
      return null;
    }

    // Get Expo push token with proper error handling
    let tokenResponse;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        console.error('❌ Expo projectId is missing. Check app.json configuration.');
        return null;
      }
      tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    } catch (error: any) {
      console.error('❌ Failed to get Expo push token:', error);
      // Don't show alert for authenticated registration (silent fail)
      return null;
    }

    if (!tokenResponse?.data) {
      console.error('❌ Invalid token response from Expo:', tokenResponse);
      return null;
    }

    const token = tokenResponse.data;

    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
    const deviceName = Device.modelName || Device.deviceName || 'Unknown Device';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const osVersion = `${Platform.OS} ${Device.osVersion || ''}`.trim();

    // Pass the supplied auth token explicitly to override the interceptor; the
    // interceptor would also attach a token, but keeping this honours the
    // function contract (caller hands us the token to register under).
    try {
      await apiClient.post(
        "notifications/tokens",
        {
          token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          deviceId,
          deviceName,
          appVersion,
          osVersion,
        },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
      );
    } catch (error) {
      console.error('Failed to save push token with auth:', error);
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error registering push token with auth:', error);
    return null;
  }
}
