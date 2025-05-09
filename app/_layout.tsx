import { Stack } from "expo-router";
import "./global.css";
import ClerckAndConvex from "@/providers/ClerckAndConvex";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider } from "@/providers/notificationProvider";
import * as Notifications from "expo-notifications";

export default function RootLayout() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // <== هذه مهمة
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return (
    <ClerckAndConvex>
      <NotificationProvider>
        <>
          <StatusBar style="dark" />
          <Stack
            initialRouteName="(tabs)"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
          </Stack>
        </>
      </NotificationProvider>
    </ClerckAndConvex>
  );
}
