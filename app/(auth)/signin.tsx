import React, { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import {
  useAuth,
  useUser,
  useSession,
  useClerk,
  useSignIn,
  useSignUp,
  useSSO,
} from "@clerk/clerk-expo";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import * as Linking from "expo-linking";

import { useRouter } from "expo-router";
import { Image } from "expo-image";

WebBrowser.maybeCompleteAuthSession();
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function Page() {
  useWarmUpBrowser();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { isSignedIn, isLoaded } = useAuth();

  const onPress = async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/oauth-callback"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)/profile");
      }
    } catch (err) {
      console.error("SSO Error:", err);
    } finally {
    }
  };

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#A37E2C" />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-evenly",
        backgroundColor: "#fff",
      }}
    >
      <Image
        source={require("../../assets/images/login.gif")}
        style={{ width: "100%", height: 300 }}
      />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#18181796",
          textAlign: "center",
        }}
      >
        أنت على بُعد خطوة واحدة من الأناقة.{"\n"}
        سجّل دخولك، واستمتع بأفضل تجربة تسوق مع{" "}
        <Text style={{ color: "#A37E2C" }}>Nubian.</Text>
      </Text>
      <TouchableOpacity onPress={onPress}>
        <View
          style={{
            width: 200,
            alignItems: "center",
            justifyContent: "space-around",
            flexDirection: "row",
            backgroundColor: "#9B7931DC",
            borderRadius: 15,
            padding: 10,
          }}
        >
          <Image
            source={require("../../assets/images/google.svg")}
            style={{ width: 20, height: 20, tintColor: "white" }}
          />
          <Text style={{ color: "white", fontSize: 18 }}>
            التسجيل بواسطة قوقل
          </Text>
        </View>
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 12,
          color: "#A37E2C",
          position: "absolute",
          bottom: 0,
        }}
      >
        © 2025 Nubian. All rights reserved.
      </Text>
    </View>
  );
}
