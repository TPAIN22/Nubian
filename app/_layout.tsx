import React from "react";
import { Stack } from "expo-router";
import "./global.css";
import ClerkProvider from "@/providers/ClerckAndConvex";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider} from "@/providers/notificationProvider";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, 
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  return (
    <ClerkProvider>
      <NotificationProvider>
        <>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{ headerShown: false }}
            initialRouteName="(onboarding)"
          >

            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="[details]" />
          </Stack>
          <Toast/>
        </>
      </NotificationProvider>
    </ClerkProvider>
  );
}
