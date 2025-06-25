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
import i18n from '../../utils/i18n';

export default function welcom() {

  const router = useRouter();
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>

        {/* المحتوى الرئيسي */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text className="text-5xl text-[#e98c22] my-5 mt-5 font-extrabold text-center">
              {i18n.t('brandName')}
            </Text>
            <Image
              source={require("../../assets/images/Online-shopping.gif")}
              style={{ width: 350, height: 300 }}
            />
            <Text className="text-2xl text-[#e98c22] my-5 mt-5 font-extrabold">
              {i18n.t('welcomeSlogan')}
            </Text>
            <Text className="text-xl text-[#30a1a7] font-medium text-right">
              {i18n.t('welcomeSubText')}
            </Text>
          </View>
        </View>

        <View>
          <TouchableOpacity
            onPress={() => {
        
  
              router.push(`../../(tabs)`);
            }}
            style={{
              backgroundColor: "#e98c22",
              padding: 15,
              borderRadius: 10,
            }}
          >
            <Text className="text-xl text-[#fff] font-bold text-center">
              {i18n.t('startShopping')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
