import { Stack } from "expo-router";
import "./global.css";
import ClerckAndConvex from "@/providers/ClerckAndConvex";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <ClerckAndConvex>
      <>
      <StatusBar style="dark" />
        <Stack 
          initialRouteName="(tabs)"
          screenOptions={{ headerShown: false }}
          >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
        </Stack>  
    </>
  </ClerckAndConvex>
  );
}