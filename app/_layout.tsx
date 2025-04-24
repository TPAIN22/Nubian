import { Stack } from "expo-router";
import "./global.css"
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <>
    <Stack screenOptions={{ headerShown: false , animation: 'slide_from_left'}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcom" />
      <Stack.Screen name="(tabs)" />
    </Stack>
    <Toast/>
    </>
  )}
