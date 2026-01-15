import { View } from "react-native";
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";

export default function _layout() {
  return (
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ header: () => <AppHeader showNotifications={false} /> }}>
          <Stack.Screen name="[id]" options={{ headerShown: false }} />
          <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="products/[type]" options={{ headerShown: false }} />
          <Stack.Screen name="editProfile" options={{ headerShown: false }} />
          <Stack.Screen name="notification" options={{ headerShown: false }} />
          <Stack.Screen name="details/[details]" options={{ headerShown: false }} />
          <Stack.Screen name="order" options={{ headerShown: false }} />
          <Stack.Screen name="addresses" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: false }} />
          <Stack.Screen name="order-success" options={{ headerShown: false }} />
          <Stack.Screen name="order-tracking/[orderId]" options={{ headerShown: false }} />
        </Stack>
      </View>
  );
}

