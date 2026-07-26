import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

/**
 * Entry gate: send first-run users to onboarding, everyone else to the tabs.
 *
 * Reads the same `hasSeenOnboarding` key that the onboarding and auth screens
 * write and that `_layout.tsx` gates the splash on. It used to read its own
 * `hasLaunched` key, which nothing else ever wrote — so this gate and the
 * `initialRouteName` gate in the root layout could disagree about whether
 * onboarding was done. The flag is deliberately re-read on each mount rather
 * than cached, so completing onboarding is picked up with nothing to invalidate.
 */
export default function Index() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding")
      .then((value) => setHasSeenOnboarding(value === "true"))
      .catch(() => setHasSeenOnboarding(false));
  }, []);

  if (hasSeenOnboarding === null) return null;
  return <Redirect href={hasSeenOnboarding ? "/(tabs)" : "/(onboarding)"} />;
}
