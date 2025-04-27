import { Stack } from "expo-router";
import "./global.css";
import Toast from 'react-native-toast-message';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
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
    </ClerkProvider>
  );
}
