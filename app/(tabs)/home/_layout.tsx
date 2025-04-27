import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function _layout() {
  return (
    <View style={{ flex: 1 , height: '100%'}}>
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Nubian',
        headerStyle: {
        }
      }}
      />
      <StatusBar style="dark"/>
      </View>
  );
}
