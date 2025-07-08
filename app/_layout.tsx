import React, { useState, useEffect, useCallback } from "react";
import "@/app\\global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Stack } from "expo-router";
import "./global.css";
import ClerkProvider from "@/providers/Clerck";
import { useAuth } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider } from "@/providers/notificationProvider";
import { SmartSystemsProvider } from "@/providers/SmartSystemsProvider";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import * as SplashScreen from "expo-splash-screen";
import GifLoadingScreen from "./GifLoadingScreen";
import NoNetworkScreen from "./NoNetworkScreen";
import { Alert } from 'react-native';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { I18nManager } from 'react-native';
import i18n from '@/utils/i18n';

import * as Updates from 'expo-updates';

import { NetworkProvider, useNetwork } from "@/providers/NetworkProvider";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Add this property
    shouldShowList: true, // Add this property
  }),
});

SplashScreen.preventAutoHideAsync();

function AppLoaderWithClerk() {
  const { isLoaded } = useAuth();
  const [gifAnimationFinished, setGifAnimationFinished] = useState<boolean>(false);
  const [isUpdateChecking, setIsUpdateChecking] = useState<boolean>(true);
  const [hasGifStartedDisplaying, setHasGifStartedDisplaying] = useState<boolean>(false);

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();


  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (!__DEV__ && isConnected === true) {
        try {
          setIsUpdateChecking(true);
          const update = await Updates.checkForUpdateAsync();

          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();

            Alert.alert(
              i18n.t('updateAvailableTitle'),
              i18n.t('updateAvailableMessage'),
              [
                {
                  text: i18n.t('no'),
                  style: "cancel",
                  onPress: () => {
                    setIsUpdateChecking(false);
                  }
                },
                {
                  text: i18n.t('yes'),
                  onPress: () => {
                    Updates.reloadAsync();
                  }
                }
              ],
              { cancelable: false }
            );
          } else {
            setIsUpdateChecking(false);
          }
        } catch (error) {
          Toast.show({ type: 'info', text1: i18n.t('updateErrorTitle'), text2: i18n.t('updateErrorMessage'), visibilityTime: 3000 });
          setIsUpdateChecking(false);
        }
      } else if (isConnected === false) {
        setIsUpdateChecking(false);
      } else {
        setIsUpdateChecking(false);
      }
    }

    if (!isNetworkChecking) { // انتظر حتى ينتهي NetworkProvider من التحقق الأولي
      onFetchUpdateAsync();
    }
  }, [isConnected, isNetworkChecking]); // يعتمد على isConnected و isNetworkChecking

  const onGifFinish = useCallback(() => {
    setGifAnimationFinished(true);
  }, []);

  const onGifComponentMounted = useCallback(() => {
    setHasGifStartedDisplaying(true);
  }, []);


  useEffect(() => {
    async function hideSplash() {
      if (hasGifStartedDisplaying) {
        await SplashScreen.hideAsync();
      }
      else if (isConnected === true && isLoaded && gifAnimationFinished && !isUpdateChecking) {
        await SplashScreen.hideAsync();
      }
      else if (isConnected === false) {
        await new Promise(resolve => setTimeout(resolve, 50)); 
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isConnected, isLoaded, gifAnimationFinished, isUpdateChecking, hasGifStartedDisplaying]);


  const handleRetryNetwork = useCallback(() => {
    retryNetworkCheck();
    setIsUpdateChecking(true);
  }, [retryNetworkCheck]);

  useEffect(() => {
  }, []);

  if (isNetworkChecking) {
    return <GluestackUIProvider mode="light"><GifLoadingScreen onAnimationFinish={() => {}} onMount={onGifComponentMounted} /></GluestackUIProvider>;
  }

  if (isConnected === false) {
    return <GluestackUIProvider mode="light"><NoNetworkScreen onRetry={handleRetryNetwork} /></GluestackUIProvider>;
  }

  if (!gifAnimationFinished || !isLoaded || isUpdateChecking) {
    return <GluestackUIProvider mode="light"><GifLoadingScreen onAnimationFinish={onGifFinish} onMount={onGifComponentMounted} /></GluestackUIProvider>;
  }

  return (
    <GluestackUIProvider mode="light">
      {/* <SmartSystemsProvider> */}
        <NotificationProvider>
          <>
          <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
              <Stack.Screen name="(tabs)"/>
              <Stack.Screen name="(auth)"/>
              <Stack.Screen name="(onboarding)"/>
              <Stack.Screen name="(screens)"/>
            </Stack>
            <Toast />
          </>
        </NotificationProvider>
      {/* </SmartSystemsProvider> */}
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <KeyboardProvider>
      <ClerkProvider>
        <NetworkProvider>
          <AppLoaderWithClerk />
        </NetworkProvider>
      </ClerkProvider>
      </KeyboardProvider>
    </GluestackUIProvider>
  );
}