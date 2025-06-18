import {
  SafeAreaView,
} from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import HeaderComponent from "../components/costomHeader";

export default function _layout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView  style={{ flex: 1}}>
        <StatusBar style="dark" backgroundColor="#fff"/>
        <Stack screenOptions={{ header: HeaderComponent }}>
          <Stack.Screen name="editProfile" options={{ headerShown: false }} />
          <Stack.Screen name="notification" options={{ headerShown: false }} />
        </Stack>
        </SafeAreaView>
    </SafeAreaProvider>
  );
}

