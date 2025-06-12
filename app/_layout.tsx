// app/RootLayout.tsx (أو app/_layout.tsx إذا كان هو ملف الروت)

import React, { useState, useEffect, useCallback } from "react";
import "@/app\\global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
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
import { Alert, Platform } from 'react-native';

import * as Updates from 'expo-updates';

// === استيراد NetworkProvider و useNetwork ===
import { NetworkProvider, useNetwork } from "@/providers/NetworkProvider"; // تأكد من المسار الصحيح

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
              "تحديث متاح!",
              "يوجد تحديث جديد للتطبيق. هل تريد إعادة تشغيل التطبيق لتطبيق التحديث؟",
              [
                {
                  text: "لا",
                  style: "cancel",
                  onPress: () => {
                    setIsUpdateChecking(false);
                  }
                },
                {
                  text: "نعم",
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
          Toast.show({ type: 'info', text1: 'خطأ في التحديث', text2: 'لم نتمكن من التحقق من التحديثات حالياَ.', visibilityTime: 3000 });
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
      // إذا بدأ عرض GIF، أخفِ شاشة البداية
      if (hasGifStartedDisplaying) {
        await SplashScreen.hideAsync();
      }
      // إذا كان كل شيء جاهزاً (متصل، Clerk محمل، GIF انتهى، لا يوجد تحديث)
      else if (isConnected === true && isLoaded && gifAnimationFinished && !isUpdateChecking) {
        await SplashScreen.hideAsync();
      }
      // إذا لم يكن هناك اتصال، أخفِ شاشة البداية بسرعة بعد التأكد من عدم وجود GIF
      else if (isConnected === false) {
        await new Promise(resolve => setTimeout(resolve, 50)); // تأخير بسيط للتأكد من الرندر
        await SplashScreen.hideAsync();
      }
    }
    // يجب أن تكون هذه الدالة هي الوحيدة المسؤولة عن إخفاء شاشة البداية
    // و تتتبع كل المتغيرات لضمان التوقيت الصحيح.
    hideSplash();
  }, [isConnected, isLoaded, gifAnimationFinished, isUpdateChecking, hasGifStartedDisplaying]);


  const handleRetryNetwork = useCallback(() => {
    // استخدم الدالة من الـ provider لإعادة محاولة الاتصال
    retryNetworkCheck();
    // إعادة تعيين حالة التحقق من التحديثات لإعادة تشغيلها
    setIsUpdateChecking(true);
  }, [retryNetworkCheck]);


  // === شاشات التحميل وحالة الشبكة ===
  // 1. إذا كنا ما زلنا نتحقق من الشبكة
  if (isNetworkChecking) {
    return <GluestackUIProvider mode="light"><GifLoadingScreen onAnimationFinish={() => {}} onMount={onGifComponentMounted} /></GluestackUIProvider>;
  }

  // 2. إذا لم يكن هناك اتصال بالإنترنت
  if (isConnected === false) {
    return <GluestackUIProvider mode="light"><NoNetworkScreen onRetry={handleRetryNetwork} /></GluestackUIProvider>;
  }

  // 3. إذا كان الاتصال موجوداً ولكن باقي شروط التحميل لم تتحقق بعد
  if (!gifAnimationFinished || !isLoaded || isUpdateChecking) {
    return <GluestackUIProvider mode="light"><GifLoadingScreen onAnimationFinish={onGifFinish} onMount={onGifComponentMounted} /></GluestackUIProvider>;
  }

  // 4. كل شيء جاهز، اعرض التطبيق
  return (
    <GluestackUIProvider mode="light"><NotificationProvider>
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
      </NotificationProvider></GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light"><ClerkProvider>
        <NetworkProvider>
          <AppLoaderWithClerk />
        </NetworkProvider>
      </ClerkProvider></GluestackUIProvider>
  );
}