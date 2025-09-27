import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthRoutesLayout() {
  return (
    <View style={{ flex: 1, height: "100%" }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
