import 'react-native-reanimated';
import { useState, useEffect, useCallback } from "react";
import { Stack } from "expo-router";
import "./global.css";
import ClerkProvider from "@/providers/Clerck";
import { StatusBar } from "expo-status-bar";
import { NotificationProvider } from "@/providers/notificationProvider";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import GifLoadingScreen from "./GifLoadingScreen";
import NoNetworkScreen from "./NoNetworkScreen";
import { Platform, View, I18nManager } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useFonts } from "@/hooks/useFonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NetworkProvider, useNetwork } from "@/providers/NetworkProvider";
import { LanguageProvider } from "@/utils/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useTokenManager } from "@/hooks/useTokenManager";
import { NotificationPortal } from "@/components/notifications/NotificationPortal";
import { CartAnimationLayer } from "@/components/cart/CartAnimationLayer";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useHomeStore } from "@/store/useHomeStore";
import useItemStore from "@/store/useItemStore";
import { useExploreStore } from "@/store/useExploreStore";
import useProductCacheStore from "@/store/useProductCacheStore";
import { useRecommendationStore } from "@/store/useRecommendationStore";

// Conditionally import expo-navigation-bar (not available in Expo Go)
let NavigationBar: any = null;
try {
  NavigationBar = require("expo-navigation-bar");
} catch (e) {
  // expo-navigation-bar not available (running in Expo Go)
  console.log("[Layout] expo-navigation-bar not available");
}

// Auto-hide Android navigation bar on app start (only if native module is available)
if (Platform.OS === "android" && NavigationBar) {
  try {
    // Hide navigation bar (other methods not supported in edge-to-edge mode)
    NavigationBar.setVisibilityAsync("hidden");
  } catch (e) {
    // Ignore errors if navigation bar API is not available
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function AppLoaderWithClerk() {
  const [gifAnimationFinished, setGifAnimationFinished] =
    useState<boolean>(false);
  const [isUpdateChecking, setIsUpdateChecking] = useState<boolean>(true);
  const [hasGifStartedDisplaying, setHasGifStartedDisplaying] =
    useState<boolean>(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState<boolean>(true);
  // Minimum brand-moment window: the launch video is allowed to show for at most
  // MIN_SPLASH_MS. Once elapsed, the app enters as soon as startup work is done —
  // it no longer waits for the video to play all the way to the end.
  const [minSplashElapsed, setMinSplashElapsed] = useState<boolean>(false);

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();

  // Initialize token manager for API requests
  useTokenManager();

  // Keep Android navigation bar hidden and match theme
  // Auto-hide after 2 seconds when shown via swipe
  useEffect(() => {
    if (Platform.OS === "android" && NavigationBar) {
      let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const setupNavigationBar = async () => {
        try {
          // Only use setVisibilityAsync - other methods not supported in edge-to-edge mode
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (e) {
          // Ignore errors if navigation bar API is not available
        }
      };
      setupNavigationBar();

      // Listen for visibility changes and auto-hide after 2 seconds
      const subscription = NavigationBar.addVisibilityListener?.(
        ({ visibility }: { visibility: string }) => {
          if (visibility === "visible") {
            // Clear any existing timeout
            if (hideTimeoutId) {
              clearTimeout(hideTimeoutId);
            }
            // Hide after 2 seconds
            hideTimeoutId = setTimeout(async () => {
              try {
                await NavigationBar.setVisibilityAsync("hidden");
              } catch (e) {
                // Ignore errors
              }
            }, 2000);
          }
        }
      );

      return () => {
        // Cleanup timeout and subscription
        if (hideTimeoutId) {
          clearTimeout(hideTimeoutId);
        }
        subscription?.remove?.();
      };
    }
    return undefined;
  }, []);

  const { fontsLoaded, fontError } = useFonts();

  // Check if user has seen onboarding — runs immediately, no need to wait for fonts
  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    }

    checkOnboardingStatus();
  }, []);

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

  // Update checking disabled - set to false immediately
  useEffect(() => {
    setIsUpdateChecking(false);
  }, []);

  // Cap the launch-video brand moment. After this fires, entry is gated only on
  // real startup work (network + fonts + onboarding check), never on the video.
  const MIN_SPLASH_MS = 1200;
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const onGifFinish = useCallback(() => {
    setGifAnimationFinished(true);
  }, []);

  const onGifComponentMounted = useCallback(() => {
    setHasGifStartedDisplaying(true);
  }, []);

  useEffect(() => {
    async function hideSplash() {
      // Hide native splash as soon as our loading screen is visible
      if (hasGifStartedDisplaying) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [hasGifStartedDisplaying]);

  const handleRetryNetwork = useCallback(() => {
    retryNetworkCheck();
    setIsUpdateChecking(true);
  }, [retryNetworkCheck]);

  useEffect(() => {
    // 🌍 Global Currency Refresh Listener
    // When the user changes their currency, we need to refresh all product data
    // to reflect the new prices and currency symbols.
    const unsubscribe = useCurrencyStore.subscribe(
      (state) => state.currencyCode,
      (currencyCode, previousCurrencyCode) => {
        // Refresh on currency change AND on initial hydration (null → value).
        // Without this, home data fetched on mount has no currency header (USD prices)
        // and never gets re-fetched when AsyncStorage restores the saved currency.
        if (currencyCode && currencyCode !== previousCurrencyCode) {
          useItemStore.getState().resetProducts();
          useExploreStore.getState().reset();
          useProductCacheStore.getState().clearAll();
          useRecommendationStore.getState().reset();
          // /home is now the single source of truth for home product lists
          // (brandsYouLove included). /recommendations/home is no longer used
          // by the home screen, so we don't need to refetch it on currency
          // change. Per-product / per-cart recommendations re-fetch lazily
          // when those screens mount, after reset() wiped the stale entries.
          useHomeStore.getState().fetchHomeData();
        }
      }
    );

    return unsubscribe;
  }, []);

  // 🌍 Seed a default currency from the device locale once the persisted store
  // has rehydrated, and load currency metadata (symbols/decimals) app-wide.
  // Replaces the old blocking currency modal: a first-run Gulf user sees local
  // prices with zero taps. The null→value set here trips the refresh listener
  // above, so home data re-fetches with the correct x-currency header.
  const currencyLoaded = useCurrencyStore((s) => s.isLoaded);
  useEffect(() => {
    if (!currencyLoaded) return;
    useCurrencyStore.getState().ensureCurrencyDefault();
    useCurrencyStore.getState().fetchMetadata();
  }, [currencyLoaded]);

  // Entry is gated on two things: (1) real startup work being done, and (2) the
  // brand moment being satisfied — which is EITHER the video finishing OR the
  // minimum splash window elapsing, whichever comes first. This keeps the launch
  // snappy: a fast device enters right after MIN_SPLASH_MS instead of waiting out
  // the whole video. One mount, video plays at most once.
  const startupDone =
    !isNetworkChecking && fontsLoaded && !isUpdateChecking && !isCheckingOnboarding;
  const brandMomentDone = gifAnimationFinished || minSplashElapsed;

  if (!startupDone || !brandMomentDone) {
    return (
      <GifLoadingScreen
        onAnimationFinish={onGifFinish}
        onMount={onGifComponentMounted}
      />
    );
  }

  if (isConnected === false) {
    return (
      <NoNetworkScreen onRetry={handleRetryNetwork} />
    );
  }

  return (
    <NotificationProvider>
      <>
        <StatusBar
          style="auto"
        />
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
          initialRouteName={hasSeenOnboarding ? "(tabs)" : "(onboarding)"}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(screens)" />
        </Stack>
        {/* Currency now defaults from device locale at startup (see effect above)
            and is changed from the Profile screen — no blocking first-run modal. */}
        {/* In-app notification cards. Mounted last so they render above the
            navigator; safe-area insets and swipe gestures come from the
            SafeAreaProvider / GestureHandlerRootView in RootLayout below. */}
        {/* Add-to-cart feedback: the product image flying to the tab bar and
            the bottom "Added to cart · View cart" card. Mounted above the
            navigator, `pointerEvents="box-none"`, and renders nothing at all
            while idle. */}
        <CartAnimationLayer />
        <NotificationPortal />
      </>
    </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
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
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
