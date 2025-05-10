import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import * as Notifications from "expo-notifications";
import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { registerForPushNotificationsAsync } from "@/utils/pushToken"; // تأكد أنك أنشأته

export default function Index() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { user } = useUser();
  const setNotificationToken = useMutation(api.token.tokens.createToken);
  const existingTokens = useQuery(
    api.token.getTokens.getToken,
    user?.id ? { userId: user.id } : "skip"
  ) as any;

  useEffect(() => {
    const init = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      if (hasLaunched === null) {
        await AsyncStorage.setItem("hasLaunched", "true");
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }

      if (user?.id && existingTokens !== undefined) {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        const alreadyStored = existingTokens.some(
          ( t : any) => t.token === token
        );
        try {
          if (!alreadyStored) {
            console.log("Saving token to database...");
            await setNotificationToken({ userId: user.id, token });
            console.log("Token saved!");
          }
        } catch (error) {
          console.error("Error saving token:", error);
        }
      }
    };

    init();
  }, [user?.id, existingTokens]);

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isFirstLaunch ? (
    <Redirect href="/(onboarding)" />
  ) : (
    <Redirect href="/(tabs)/home" />
  );
}
