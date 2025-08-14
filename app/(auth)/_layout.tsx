import { Stack } from "expo-router";
import { View } from "react-native";
import { I18nManager } from 'react-native';

export default function AuthRoutesLayout() {
  return (
    <View style={{ flex: 1, height: "100%", direction: I18nManager.isRTL ? 'rtl' : 'ltr' }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
