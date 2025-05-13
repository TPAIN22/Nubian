import { Stack } from 'expo-router'

export default function index() {
  return (
    <Stack screenOptions={{  headerTitleAlign:'left',  headerTitleStyle:{fontSize:25 , color:'#242423C5'}  }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="editProfile" />
    </Stack>
  )
}