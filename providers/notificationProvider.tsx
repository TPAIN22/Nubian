import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { useAuth } from '@clerk/clerk-expo';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, registerPushTokenWithAuth } from '@/utils/pushToken';
import { useRouter } from 'expo-router';

type NotificationContextType = {
  expoPushToken: string | null;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
});

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { getToken, userId, isLoaded } = useAuth();
  const hasRegisteredToken = useRef(false);
  const router = useRouter();

  // Set up notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });
      
      // Handle deep link navigation
      const deepLink = response.notification.request.content.data?.deepLink as unknown;
      if (typeof deepLink === "string" && deepLink.length > 0) {
        try {
          const url = deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
          
          // Navigate based on deep link path
          if (url.startsWith('/orders/')) {
            router.push(`/(tabs)/orders/${url.split('/orders/')[1]}` as any);
          } else if (url.startsWith('/products/')) {
            router.push(`/(tabs)/products/${url.split('/products/')[1]}` as any);
          } else if (url.startsWith('/cart')) {
            router.push('/(tabs)/cart' as any);
          } else {
            router.push(url as any);
          }
        } catch (error) {
          console.error('❌ Error navigating to deep link:', error);
        }
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Register push token when user is loaded and userId is available
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ Clerk not loaded yet, waiting...');
      return;
    }

    const setupPushToken = async () => {
      // Prevent duplicate registrations
      if (hasRegisteredToken.current) {
        console.log('⚠️ Push token already registered, skipping...');
        return;
      }

      try {
        console.log('🔔 Setting up push notifications...', { userId: userId || 'anonymous' });
        
        // If user is authenticated, register with auth token to link token to user
        if (userId) {
          try {
            const authToken = await getToken();
            if (authToken) {
              console.log('✅ Got auth token, registering push token with authentication...');
              // Register token with authentication to link it to the user
              const token = await registerPushTokenWithAuth(authToken);
              if (token) {
                setExpoPushToken(token);
                hasRegisteredToken.current = true;
                console.log('✅ Push token registered with authentication:', token.substring(0, 30) + '...');
                return;
              } else {
                console.warn('⚠️ Failed to register push token with auth, trying anonymous...');
              }
            } else {
              console.warn('⚠️ No auth token available, registering anonymously...');
            }
          } catch (error) {
            console.error('❌ Error registering push token with auth:', error);
          }
        }
        
        // Fallback: Register anonymously (for users not logged in)
        console.log('📱 Registering push token anonymously...');
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          hasRegisteredToken.current = true;
          console.log('✅ Push token registered anonymously:', token.substring(0, 30) + '...');
        } else {
          console.error('❌ Failed to register push token');
        }
      } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
        hasRegisteredToken.current = false; // Allow retry
      }
    };

    setupPushToken();
  }, [userId, isLoaded, getToken]); // Re-run when user logs in/logs out or when Clerk loads

  // Re-register token when userId changes (user logs in) - reset flag to allow re-registration
  useEffect(() => {
    if (isLoaded && userId && expoPushToken) {
      // User just logged in, re-register token with auth to link it to user account
      const reRegisterWithAuth = async () => {
        try {
          const authToken = await getToken();
          if (authToken) {
            console.log('🔄 User logged in, re-registering push token with auth...', {
              hasToken: !!expoPushToken,
              userId,
            });
            const token = await registerPushTokenWithAuth(authToken);
            if (token) {
              setExpoPushToken(token);
              hasRegisteredToken.current = true;
              console.log('✅ Push token re-registered with authentication after login:', token.substring(0, 30) + '...');
            } else {
              console.warn('⚠️ Failed to re-register push token with auth after login');
              hasRegisteredToken.current = false; // Allow retry
            }
          }
        } catch (error) {
          console.error('❌ Error re-registering push token after login:', error);
          hasRegisteredToken.current = false; // Allow retry on error
        }
      };
      
      // Only re-register if we haven't registered with auth yet
      // Check if token exists but wasn't registered with auth
      if (!hasRegisteredToken.current || (expoPushToken && !expoPushToken.includes('ExponentPushToken'))) {
        reRegisterWithAuth();
      }
    } else if (isLoaded && !userId && expoPushToken) {
      // User logged out - token remains but flag reset
      console.log('👋 User logged out, push token remains active');
      hasRegisteredToken.current = false;
    }
  }, [userId, isLoaded, expoPushToken, getToken]);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
