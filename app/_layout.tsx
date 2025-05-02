import { Stack } from "expo-router";
import "./global.css";
import Toast from 'react-native-toast-message';
import ClerckAndConvex from "@/providers/ClerckAndConvex";
import { GlobalProvider } from "@/providers/GlobalContext";

export default function RootLayout() {
  return (
    <GlobalProvider>
      <ClerckAndConvex>
        <>
          <Stack 
            initialRouteName="(onboarding)"
            screenOptions={{ headerShown: false }}
            >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
          </Stack>  
          <Toast />
        </>
      </ClerckAndConvex>
    </GlobalProvider>
  );
}
