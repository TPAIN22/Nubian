import { useState, useEffect, useCallback } from "react";
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
import NoNetworkScreen from "./NoNetworkScreen";
import { Alert, Platform } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import i18n from "@/utils/i18n";
import { useFonts } from "@/hooks/useFonts";

import * as Updates from "expo-updates";

import { NetworkProvider, useNetwork } from "@/providers/NetworkProvider";
import { View } from "react-native";
import { I18nManager } from "react-native";
import { LanguageProvider } from "@/utils/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { useTokenManager } from "@/hooks/useTokenManager";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function AppLoaderWithClerk() {
  const { isLoaded } = useAuth();
  const [gifAnimationFinished, setGifAnimationFinished] =
    useState<boolean>(false);
  const [isUpdateChecking, setIsUpdateChecking] = useState<boolean>(true);
  const [hasGifStartedDisplaying, setHasGifStartedDisplaying] =
    useState<boolean>(false);

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();
  const { isDark } = useTheme();
  
  // Initialize token manager for API requests
  useTokenManager();
  
  // Load Cairo fonts
  const { fontsLoaded, fontError } = useFonts();

  // Debug font loading
  useEffect(() => {
    if (__DEV__) {
      if (fontError) {
        console.error('Font loading error:', fontError);
      }
      if (fontsLoaded) {
        console.log('✅ Cairo fonts loaded successfully');
      } else {
        console.log('⏳ Loading Cairo fonts...');
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (!__DEV__ && isConnected === true) {
        try {
          setIsUpdateChecking(true);
          const update = await Updates.checkForUpdateAsync();

          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();

            Alert.alert(
              i18n.t("updateAvailableTitle"),
              i18n.t("updateAvailableMessage"),
              [
                {
                  text: i18n.t("no"),
                  style: "cancel",
                  onPress: () => {
                    setIsUpdateChecking(false);
                  },
                },
                {
                  text: i18n.t("yes"),
                  onPress: () => {
                    Updates.reloadAsync();
                  },
                },
              ],
              { cancelable: false }
            );
          } else {
            setIsUpdateChecking(false);
          }
        } catch (error) {
          Toast.show({
            type: "info",
            text1: i18n.t("updateErrorTitle"),
            text2: i18n.t("updateErrorMessage"),
            visibilityTime: 3000,
          });
          setIsUpdateChecking(false);
        }
      } else if (isConnected === false) {
        setIsUpdateChecking(false);
      } else {
        setIsUpdateChecking(false);
      }
    }

    if (!isNetworkChecking) {
      // انتظر حتى ينتهي NetworkProvider من التحقق الأولي
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
      } else if (
        isConnected === true &&
        isLoaded &&
        gifAnimationFinished &&
        !isUpdateChecking
      ) {
        await SplashScreen.hideAsync();
      } else if (isConnected === false) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [
    isConnected,
    isLoaded,
    gifAnimationFinished,
    isUpdateChecking,
    hasGifStartedDisplaying,
  ]);

  const handleRetryNetwork = useCallback(() => {
    retryNetworkCheck();
    setIsUpdateChecking(true);
  }, [retryNetworkCheck]);

  useEffect(() => {}, []);

  if (isNetworkChecking || !fontsLoaded) {
    return (
        <GifLoadingScreen
          onAnimationFinish={() => {}}
          onMount={onGifComponentMounted}
        />
    );
  }

  if (isConnected === false) {
    return (
        <NoNetworkScreen onRetry={handleRetryNetwork} />
    );
  }

  if (!gifAnimationFinished || !isLoaded || isUpdateChecking) {
    return (
        <GifLoadingScreen
          onAnimationFinish={onGifFinish}
          onMount={onGifComponentMounted}
        />
    );
  }

  return (
      <NotificationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
        <>
          <StatusBar style={isDark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              gestureDirection: "horizontal",
              animation:
                Platform.OS === "android"
                  ? (I18nManager.isRTL ? "slide_from_left" : "slide_from_right")
                  : "fade",
            }}
            initialRouteName="(onboarding)"
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(screens)" />
          </Stack>
          <Toast />
        </>
        </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <KeyboardProvider>
          <ClerkProvider>
            <NetworkProvider>
              <View
                style={{
                  direction: I18nManager.isRTL ? "rtl" : "ltr",
                  flex: 1,
                }}
              >
                <AppLoaderWithClerk />
              </View>
            </NetworkProvider>
          </ClerkProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
