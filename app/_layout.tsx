import 'react-native-reanimated';
import { useState, useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import "./global.css";
import ClerkProvider from "@/providers/Clerck";
import { useAuth } from "@clerk/clerk-expo";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider } from "@/providers/notificationProvider";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import GifLoadingScreen from "./GifLoadingScreen";
import NoNetworkScreen from "./NoNetworkScreen";
import { Alert, Platform, View, I18nManager } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import i18n from "@/utils/i18n";
import { useFonts } from "@/hooks/useFonts";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Updates from "expo-updates";

import { NetworkProvider, useNetwork } from "@/providers/NetworkProvider";
import { LanguageProvider } from "@/utils/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { useTokenManager } from "@/hooks/useTokenManager";
import { Toaster } from "sonner-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Enable badge count
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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState<boolean>(true);

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();
  const { isDark } = useTheme();
  
  // Initialize token manager for API requests
  useTokenManager();

  // Load Cairo fonts
  const { fontsLoaded, fontError } = useFonts();

  // Check if user has seen onboarding
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false); // Default to showing onboarding if error
      } finally {
        setIsCheckingOnboarding(false);
      }
    }

    if (fontsLoaded) {
      checkOnboardingStatus();
    }
  }, [fontsLoaded]);

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
        } catch {
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
        !isUpdateChecking &&
        !isCheckingOnboarding
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
    isCheckingOnboarding,
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

  if (!gifAnimationFinished || !isLoaded || isUpdateChecking || isCheckingOnboarding) {
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
                  : "default",
                  animationDuration: 1000,
            }}
            initialRouteName={hasSeenOnboarding ? "(tabs)" : "(onboarding)"}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(screens)" />
          </Stack>
          <Toaster position="top-center" duration={3000} richColors/>
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
