import React, { useState, useEffect, useCallback, useRef } from "react";
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
import * as Network from "expo-network";
import NoNetworkScreen from "./NoNetworkScreen";
import { Alert, Platform } from 'react-native';
import { EventSubscription } from 'expo-modules-core';

import * as Updates from 'expo-updates';

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
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isUpdateChecking, setIsUpdateChecking] = useState(true);
  const isShowingNoNetworkAlert = useRef(false);

  // <--- NEW: حالة جديدة لتحديد ما إذا كان الـ GIF بدأ بالفعل في الظهور
  const [hasGifStartedDisplaying, setHasGifStartedDisplaying] = useState(false);

  // --- لوجات تشخيصية لحالة التحميل ---
  useEffect(() => {
  }, [isLoaded, gifAnimationFinished, isConnected, isUpdateChecking, hasGifStartedDisplaying]);

  // --- 1. جزء فحص الشبكة الأولي عند التحميل ---
  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = Boolean(networkState.isConnected && networkState.isInternetReachable);
      setIsConnected(connected);
    } catch (error) {
      console.error("NETWORK_CHECK_ERROR: Failed to get network state", error);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected === null) {
      checkNetworkStatus();
    }
  }, [isConnected, checkNetworkStatus]);

  // --- NEW: منطق تحديثات OTA (بدون تغيير) ---
  useEffect(() => {
    async function onFetchUpdateAsync() {
      if (!__DEV__) {
        try {
          setIsUpdateChecking(true);
          const update = await Updates.checkForUpdateAsync();

          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            Alert.alert(
              "تحديث متاح!",
              "يوجد تحديث جديد للتطبيق. هل تريد إعادة تشغيل التطبيق لتطبيق التحديث؟",
              [
              ],
              { cancelable: false }
            );
          } else {
            setIsUpdateChecking(false);
          }
        } catch (error) {
          console.error('OTA_UPDATE_ERROR: Failed to check for updates', error);
          Toast.show({ type: 'info', text1: 'خطأ في التحديث', text2: 'لم نتمكن من التحقق من التحديثات حالياَ.', visibilityTime: 3000 });
          setIsUpdateChecking(false);
        }
      } else {
        setIsUpdateChecking(false);
      }
    }

    if (isConnected === true && isConnected !== null) {
      onFetchUpdateAsync();
    } else if (isConnected === false) {
      setIsUpdateChecking(false);
    }
  }, [isConnected]);

  // --- مراقبة حالة الشبكة في الوقت الفعلي بعد التحميل الأولي (بدون تغيير جوهري) ---
  useEffect(() => {
    let unsubscribe: EventSubscription | undefined;
    if (isLoaded && gifAnimationFinished && isConnected === true && !isUpdateChecking) {
      const startListening = async () => {
        unsubscribe = Network.addNetworkStateListener((status) => {
          const newConnected = Boolean(status.isConnected && status.isInternetReachable);

          if (newConnected === false && !isShowingNoNetworkAlert.current) {
            isShowingNoNetworkAlert.current = true;
            Toast.show({ type: 'error', text1: 'فقدان الاتصال بالإنترنت!', text2: 'يرجى التحقق من اتصالك وإعادة المحاولة.', visibilityTime: 4000, onHide: () => { isShowingNoNetworkAlert.current = false; } });
          } else if (newConnected === true && isShowingNoNetworkAlert.current) {
            Toast.hide();
            Toast.show({ type: 'success', text1: 'تم استعادة الاتصال!', text2: 'أنت متصل بالإنترنت الآن.', visibilityTime: 2000, });
            isShowingNoNetworkAlert.current = false;
          }
        });
      };
      startListening();
    }
    return () => { if (unsubscribe) { unsubscribe.remove(); } };
  }, [isLoaded, gifAnimationFinished, isConnected, isUpdateChecking]);

  // --- 2. إدارة انتهاء الـ GIF ---
  const onGifFinish = useCallback(() => {
    setGifAnimationFinished(true);
  }, []);

  // <--- NEW: وظيفة مساعدة لتشغيلها عند بدء عرض الـ GIF
  const onGifComponentMounted = useCallback(() => {
    setHasGifStartedDisplaying(true); // <--- تحديث الحالة
    // ممكن تنادي على SplashScreen.hideAsync() هنا مباشرة لو عايز
    // لكن الأفضل نخليها في useEffect اللي جاي عشان الترتيب يكون أوضح
  }, []);


  // --- 3. المنطق النهائي لإخفاء Splash Screen (تعديل طفيف) ---
  useEffect(() => {
    async function hideSplash() {
      // الشرط الجديد: لو الـ GIF بدأ يظهر (hasGifStartedDisplaying)، نخفي الـ Splash الأولي
      if (hasGifStartedDisplaying) {
        await SplashScreen.hideAsync();
      }
      // الشرط الأصلي بتاع إخفاء الـ Splash في النهاية لما كل حاجة تكون خلصت
      // ده عشان لو كان فيه تأخير في ظهور الـ GIF نفسه (لكن حالتك بتقول إنه بيظهر فوراً)
      else if (isConnected === true && isLoaded && gifAnimationFinished && !isUpdateChecking) {
        await SplashScreen.hideAsync();
      } else if (isConnected === false) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [isConnected, isLoaded, gifAnimationFinished, isUpdateChecking, hasGifStartedDisplaying]); // أضف hasGifStartedDisplaying هنا


  // --- 4. إعادة محاولة الاتصال بالشبكة (بدون تغيير) ---
  const onRetryNetwork = useCallback(() => {
    setIsConnected(null);
    setIsUpdateChecking(true);
  }, []);

  // --- ترتيب العرض: الأولوية للأكثر حرجاً ---

  // 1. لو لسه بنفحص الشبكة
  if (isConnected === null) {
    // <--- تمرير onGifComponentMounted
    return <GifLoadingScreen onAnimationFinish={() => {}} onMount={onGifComponentMounted} />;
  }

  // 2. لو مفيش شبكة
  if (isConnected === false) {
    return <NoNetworkScreen onRetry={onRetryNetwork} />;
  }

  // 3. لو فيه شبكة، لكن الـ GIF لسه بيعرض أو Clerk لسه بيحمل أو بنتحقق من التحديثات
  // هنا بنظهر الـ GIF و بنمرر onMount للـ GIF
  if (!gifAnimationFinished || !isLoaded || isUpdateChecking) {
    return <GifLoadingScreen onAnimationFinish={onGifFinish} onMount={onGifComponentMounted} />;
  }

  // 4. لو كل حاجة تمام
  return (
    <NotificationProvider>
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(onboarding)">
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