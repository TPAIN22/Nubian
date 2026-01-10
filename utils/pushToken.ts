import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import i18n from "@/utils/i18n";
import { useAuth } from '@clerk/clerk-expo';

// API base URL - use environment variable or fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nubian-lne4.onrender.com';

/**
 * Enhanced push token registration with new notification system
 * Supports anonymous tokens (allowAnonymous: true)
 * Supports multi-device (multiDevice: true)
 * Auto-cleanup handled by backend (autoCleanup: true)
 */
export async function registerForPushNotificationsAsync(userId?: string | null) {
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

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
    });
    const token = tokenResponse.data;

    // Get device info
    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
    const deviceName = Device.modelName || Device.deviceName || 'Unknown Device';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const osVersion = `${Platform.OS} ${Device.osVersion || ''}`.trim();

    // Prepare headers with authentication if user is logged in
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if user is authenticated
    // Note: You'll need to get the token from Clerk
    // For now, we'll send without auth (anonymous tokens are allowed)
    
    // Send token to new API endpoint
    const response = await fetch(`${API_BASE_URL}/api/notifications/tokens`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        deviceId,
        deviceName,
        appVersion,
        osVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to save push token:', errorData);
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
        sound: 'default',
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

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
    });
    const token = tokenResponse.data;

    const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown-device';
    const deviceName = Device.modelName || Device.deviceName || 'Unknown Device';
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const osVersion = `${Platform.OS} ${Device.osVersion || ''}`.trim();

    const response = await fetch(`${API_BASE_URL}/api/notifications/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
        deviceId,
        deviceName,
        appVersion,
        osVersion,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to save push token with auth:', errorData);
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error registering push token with auth:', error);
    return null;
  }
}
