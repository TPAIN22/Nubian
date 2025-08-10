import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

export default function Index() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasLaunched").then((value) => {
      if (value === null) {
        AsyncStorage.setItem("hasLaunched", "true");
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) return null; // شاشة فاضية مؤقتًا أثناء الفحص

  return <Redirect href={isFirstLaunch ? "/(onboarding)" : "/(onboarding)"} />;
}
