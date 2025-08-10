import { View } from "react-native";
import { Stack } from "expo-router";
import HeaderComponent from "../components/costomHeader";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from 'react-native';

export default function _layout() {
  return (
      <View style={{ flex: 1, direction: I18nManager.isRTL ? 'rtl' : 'ltr' }}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ header: HeaderComponent }}>
          <Stack.Screen name="editProfile" options={{ headerShown: false }} />
          <Stack.Screen name="notification" options={{ headerShown: false }} />
          <Stack.Screen name="details/[details]" options={{ headerShown: false }} />
          <Stack.Screen name="order" options={{ headerShown: false }} />
          <Stack.Screen name="addresses" options={{ headerShown: false }} />
          <Stack.Screen name="order-tracking/[orderId]" options={{ headerShown: false }} />
        </Stack>
      </View>
  );
}

