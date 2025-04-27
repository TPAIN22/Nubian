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
  const [selectedCity, setSelectedCity] = useState("");

  const cities = [
    { label: "اختر المدينة", value: "" },
    { label: "مدني", value: "madani" },
    { label: "بورتسودان", value: "portsudan" },
    { label: "عطبرة", value: "Atabara" },
  ];

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

            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#ddd",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                marginTop: 10,
                width: "80%",
              }}
            >
              <Picker
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  color: "#A37E2C",
                  paddingHorizontal: 10,
                  height: 50,
                  marginVertical: 10,
                  fontSize: 20,
                }}
                selectedValue={selectedCity}
                onValueChange={(itemValue) => setSelectedCity(itemValue)}
              >
                {cities.map((city) => (
                  <Picker.Item
                    color="#A37E2C"
                    key={city.value}
                    label={city.label}
                    value={city.value}
                    style={{ fontSize: 20 }}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <TouchableOpacity
            onPress={() => {
              if (!selectedCity) {
                Toast.show({
                swipeable: true,
                
                text1Style: { color: "#A37E2C" , fontSize: 25},
                text2Style: { color: "#006348" , fontSize: 15},
                  type: "error",
                  text1: "تنبيه",
                  text2: "من فضلك اختر المدينة أولاً 🏙️",
                });
                return;
              }
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
