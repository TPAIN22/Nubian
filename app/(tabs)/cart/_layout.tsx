import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function _layout() {
  const router = useRouter()
  return (
   <Stack screenOptions={{ headerBackVisible: false ,
    headerLeft: () => (
                <Pressable
                hitSlop={30}
                 onPress={() => router.replace("/(tabs)/home")}>
                  <Ionicons name="arrow-back" size={30} color="#006348" />
                </Pressable>
              ),
    }}/>
  )
}