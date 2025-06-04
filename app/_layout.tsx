import React, { useState, useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import "./global.css";
import ClerkProvider from "@/providers/Clerck";
import { useAuth } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider } from "@/providers/notificationProvider";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import GifLoadingScreen from "./GifLoadingScreen";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

function AppLoaderWithClerk() {
  const { isLoaded } = useAuth(); 
  const [gifAnimationFinished, setGifAnimationFinished] = useState(false);

  useEffect(() => {
    async function hideSplashAndPrepare() {
      if (isLoaded && gifAnimationFinished) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplashAndPrepare();
  }, [isLoaded, gifAnimationFinished]); 

  const onGifFinish = useCallback(() => {
    setGifAnimationFinished(true);
  }, []);

  if (!gifAnimationFinished || !isLoaded) {
    return <GifLoadingScreen onAnimationFinish={onGifFinish} />;
  }

  return (
    <NotificationProvider>
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="[details]" />
          <Stack.Screen name="notification" />
        </Stack>
        <Toast />
      </>
    </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider>
      <AppLoaderWithClerk /> 
    </ClerkProvider>
  );
}