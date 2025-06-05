import { Pressable, Text, View } from "react-native";
import React from "react";
import { Tabs, useRouter } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import useCartStore from "@/store/useCartStore";

export default function _layout() {
  const router = useRouter();
  const {cartItems} = useCartStore()
  const totalQuantityOfAllItems = cartItems.reduce((accumulator: number, currentItem: any) => {
  return accumulator + currentItem.quantity;
}, 0);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "##e98c22",
        headerShown: true,
        tabBarHideOnKeyboard: true,
        headerStyle: {
          height: 80,
        },
        tabBarStyle: {
          display: "none",
        },
        headerRight: () => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
            }}
          >
             <Pressable onPress={() => router.push("/notification")}>
              <Ionicons name="notifications" size={24} color="##e98c22" style={{marginRight:8}}/>
            </Pressable>
            <Pressable className="relative items-center justify-center"
            onPress={() =>router.push("/cart")}
            >
            <Ionicons name="cart" size={30} color="##e98c22" />
            <Text className="absolute -top-2 -left-2 rounded-full bg-red-400 text-white w-6 h-6 flex text-center text-md">{totalQuantityOfAllItems}</Text>
            </Pressable>
           
          </View>
        ),
        headerLeft: () => (
          <View style={{ paddingHorizontal: 2}}>
            <Image
              source={require("../../../assets/images/nubian.png")}
              style={{ width: 30, height: 30, top: 1 }}
            />
          </View>
        ),
      }}
    />
  );
}
