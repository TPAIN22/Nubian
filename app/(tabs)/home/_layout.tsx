import { View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function _layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#A37E2C",
        headerShown: true,
        tabBarHideOnKeyboard: true, 
       headerStyle: {
         height: 80,
       },
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10 }}>
          <Ionicons 
          name="cart" size={24} color="#A37E2C" />
          </View>
        ),
        headerLeft: () => (
          <Image
            source={require("../../../assets/images/icon.png")}
            style={{ width: 50, height: 50, top: 3 ,paddingHorizontal:10}}
          />
        ),
      }}
    />
  );
}

