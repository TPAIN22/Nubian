import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function index() {
  return (
    <>
    <StatusBar style="dark"/>
    <Stack screenOptions={{  headerTitleAlign:'left',  headerTitleStyle:{fontSize:25 , color:'#242423C5'}  }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="editProfile" />
    </Stack>
    </>
  )
}