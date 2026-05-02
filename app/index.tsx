import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

type Target = "/(onboarding)" | "/(tabs)" | "/(auth)/welcome";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const checkRoute = async () => {
      try {
        const [seen, guest] = await Promise.all([
          AsyncStorage.getItem("hasSeenOnboarding"),
          AsyncStorage.getItem("isGuest"),
        ]);

        if (seen !== "true") {
          setTarget("/(onboarding)");
          return;
        }

        if (isSignedIn || guest === "true") {
          setTarget("/(tabs)");
          return;
        }

        setTarget("/(auth)/welcome");
      } catch (e) {
        // fallback safe route
        setTarget("/(onboarding)");
      }
    };

    checkRoute();
  }, [isLoaded, isSignedIn]);

  if (!target) return null;

  return <Redirect href={target} />;
}