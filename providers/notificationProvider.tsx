import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '@/utils/pushToken';

type NotificationContextType = {
  expoPushToken: string | null;
};

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);
    };

    setup();
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
