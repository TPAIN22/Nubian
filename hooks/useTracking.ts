import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import axiosInstance from '@/utils/axiosInstans';

const SESSION_ID_KEY = 'tracking_session_id';
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface TrackingPayload {
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

/**
 * Get or create a session ID for tracking
 */
const getSessionId = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      const { sessionId, timestamp } = JSON.parse(stored);
      // Check if session is still valid (30 minutes)
      if (Date.now() - timestamp < SESSION_EXPIRY_MS) {
        return sessionId;
      }
    }
    // Create new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(SESSION_ID_KEY, JSON.stringify({
      sessionId: newSessionId,
      timestamp: Date.now(),
    }));
    return newSessionId;
  } catch (error) {
    // Fallback to in-memory session ID if storage fails
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Get device information
 */
const getDeviceInfo = (): string => {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
};

/**
 * Hook for tracking user events
 */
export const useTracking = () => {
  const { userId, getToken } = useAuth();

  /**
   * Track an event
   */
  const trackEvent = useCallback(async (
    eventName: string,
    payload: TrackingPayload = {}
  ) => {
    try {
      const sessionId = await getSessionId();
      const device = getDeviceInfo();
      
      // Determine screen name from payload or use default
      const screen = payload.screen || 'unknown';

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

      // Remove undefined values
      const cleanEventData = Object.fromEntries(
        Object.entries(eventData).filter(([_, value]) => value !== undefined)
      );

      // Fire and forget - don't block UI
      axiosInstance.post('/tracking/event', cleanEventData).catch((error) => {
        // Silently fail - tracking should never break the app
        if (__DEV__) {
          console.warn('Tracking error:', error.message);
        }
      });

      if (__DEV__) {
        console.log('📊 Tracking event:', eventName, cleanEventData);
      }
    } catch (error) {
      // Silently fail - tracking should never break the app
      if (__DEV__) {
        console.warn('Tracking error:', error);
      }
    }
  }, [userId, getToken]);

  /**
   * Merge guest session with user account on login
   */
  const mergeSession = useCallback(async () => {
    if (!userId) return;
    
    try {
      const sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
      if (sessionId) {
        const sessionData = JSON.parse(sessionId);
        // Notify backend to merge session data
        await axiosInstance.post('/tracking/merge-session', {
          sessionId: sessionData.sessionId,
          userId,
        }).catch(() => {
          // Silently fail
        });
      }
    } catch (error) {
      // Silently fail
      if (__DEV__) {
        console.warn('Session merge error:', error);
      }
    }
  }, [userId]);

  return {
    trackEvent,
    mergeSession,
  };
};

export default useTracking;
