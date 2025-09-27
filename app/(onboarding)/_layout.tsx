import { Stack } from 'expo-router/stack'
import { View } from 'react-native';

export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}/>
    </View>
  )
}