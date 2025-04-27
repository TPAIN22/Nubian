import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Toast from "react-native-toast-message";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Image, ImageBackground } from "expo-image";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

export default function welcom() {

  const router = useRouter();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <StatusBar style="dark" backgroundColor="#fff" />

        {/* المحتوى الرئيسي */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            paddingHorizontal: 20,
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text className="text-5xl text-[#A37E2C] my-5 mt-5 font-extrabold text-center">
              نـــوبيــــان{" "}
            </Text>
            <Image
              source={require("../../assets/images/Online-shopping.gif")}
              style={{ width: 350, height: 300 }}
            />
            <Text className="text-2xl text-[#A37E2C] my-5 mt-5 font-extrabold">
              جبنا ليك السوق كامل بين ايديك
            </Text>
            <Text className="text-xl text-[#006348] font-medium text-right">
              منتظر شنو!!🤔 
              {"\n"}
              اختار المدينة المتواجد فيها واستمتع بالعروض والتخفيضات
            </Text>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <TouchableOpacity
            onPress={() => {
        
  
              router.push(`../../(tabs)/home`);
            }}
            style={{
              backgroundColor: "#A37E2C",
              padding: 15,
              marginBottom: 60,
              borderRadius: 10,
            }}
          >
            <Text className="text-xl text-[#fff] font-bold text-center">
              إبــدا التسـوق
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
