import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { registerForPushNotificationsAsync, registerPushTokenWithAuth } from '@/utils/pushToken';

type NotificationContextType = {
  expoPushToken: string | null;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    const setup = async () => {
      try {
        // If user is authenticated, register with auth token to link token to user
        if (userId) {
          try {
            const authToken = await getToken();
            if (authToken) {
              // Register token with authentication to link it to the user
              const token = await registerPushTokenWithAuth(authToken);
              if (token) {
                setExpoPushToken(token);
                console.log('✅ Push token registered with authentication');
                return;
              }
            }
          } catch (error) {
            console.error('Error registering push token with auth:', error);
          }
        }
        
        // Fallback: Register anonymously (for users not logged in)
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    setup();
  }, [userId]); // Re-run when user logs in/logs out (getToken is stable from Clerk)

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
