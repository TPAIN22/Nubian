import { Stack } from 'expo-router/stack'
import { I18nManager, View } from 'react-native';

export default function Layout() {
  return (
    <View style={{ flex: 1, direction: I18nManager.isRTL ? 'rtl' : 'ltr' }}>
      <Stack screenOptions={{ headerShown: false }}/>
    </View>
  )
}