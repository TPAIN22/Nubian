import { View } from "react-native";
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";
import { useColors } from "@/hooks/useColors";

// Named with a capital so the rules-of-hooks lint recognises it as a component
// — it now calls `useColors` to paint the navigator's own background.
export default function ScreensLayout() {
  const colors = useColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          header: () => <AppHeader showNotifications={false} />,
          // Screens in this group render on the grey canvas. Without this the
          // navigator's own background is white, which flashes at the edge of
          // every push/pop transition.
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
        <Stack.Screen name="store/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="products/[type]" options={{ headerShown: false }} />
        <Stack.Screen name="editProfile" options={{ headerShown: false }} />
        <Stack.Screen name="notification" options={{ headerShown: false }} />
        <Stack.Screen name="details/[details]" options={{ headerShown: false }} />
        <Stack.Screen name="order" options={{ headerShown: false }} />
        <Stack.Screen name="addresses" options={{ headerShown: false }} />
        {/* The map picker draws its own chrome over a full-bleed map, and
            animates from the bottom so it reads as a modal step in the flow. */}
        <Stack.Screen
          name="location-picker"
          options={{ headerShown: false, animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="order-success" options={{ headerShown: false }} />
        <Stack.Screen name="order-tracking/[orderId]" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="support/create" options={{ headerShown: false }} />
        <Stack.Screen name="support/[id]" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
