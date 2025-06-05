import {
    View,
    Text,
    TouchableOpacity,
  } from "react-native";
  import React, { useEffect } from "react";
  import { StatusBar } from "expo-status-bar";
  import { Image } from "expo-image";
  import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
  import { Redirect, useRouter } from "expo-router";
  
  export default function index() {
    const router = useRouter();
    
    return (
      <SafeAreaProvider>
        <SafeAreaView>
          <StatusBar style="dark" backgroundColor="#fff" />
          <View
            style={{
              backgroundColor: "#fff",
              alignItems: "center",
              paddingHorizontal: 20,
              height: "100%",
              zIndex: 0,
              justifyContent: "space-between",
            }}
          >
            <View className="flex items-end">
              <Text className="text-5xl text-[#e98c22] my-5 mt-5 font-extrabold text-center">
                حبـــــابك الــف{" "}
              </Text>
              <Image
                source={require("../../assets/images/person.gif")}
                style={{ width: 350, height: 300 }}
              />
              <Text className="text-2xl text-[#e98c22] my-5 mt-5 font-extrabold">
                أهلاً بيك في في تطبيق نوبيان
              </Text>
              <Text className="text-xl text-[#30a1a7] font-medium text-right">
                تطبيق يسهّل ليك المشوار… تختار ✅ تطلب 👌وتستلم😎، وكل دا من
                تلفونك.📱
              </Text>
              <Text className="text-xl text-[#30a1a7] font-medium text-right">
                استمتع بتجربة تسوق فريدة وانضم الى مجتمع نوبيان!الذي يضـم العديد
                من المتاجر والاسواق السودانية!!
              </Text>
            </View>
            <View>
              <TouchableOpacity
                onPress={() => {
                  router.push("./welcom");
                }}
                style={{
                  backgroundColor: "#e98c22",
                  padding: 15,
                  borderRadius: 10,
                  minWidth: "100%",
                  alignSelf: "center",
                  position: "absolute",
                  bottom: 80,
                }}
              >
                <Text className="text-xl text-[#fff] font-bold text-center">
                  بدء التجربة
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
  