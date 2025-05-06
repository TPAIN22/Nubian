import { Stack } from "expo-router";
import "./global.css";
import Toast from 'react-native-toast-message';
import ClerckAndConvex from "@/providers/ClerckAndConvex";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <ClerckAndConvex>
      <>
      <GestureHandlerRootView style={{flex:1}}>
      <StatusBar style="dark" />
        <Stack 
          initialRouteName="(tabs)"
          screenOptions={{ headerShown: false }}
          >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
        </Stack>  
        <Toast />
        </GestureHandlerRootView>
    </>
  </ClerckAndConvex>
  );
}