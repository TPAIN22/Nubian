// app/(tabs)/_layout.js

import React, { useEffect } from "react"; // [تغيير/إضافة] استيراد useEffect
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import { View, LayoutAnimation, Platform, UIManager } from "react-native"; // [تغيير/إضافة] استيراد LayoutAnimation, Platform, UIManager
import { StatusBar } from "expo-status-bar";
import useItemStore from "@/store/useItemStore"; // الاستيراد كما هو، لا تغيير فيه حسب طلبك

const iconSize = 24;
const focusedColor = "#e98c22";
const unfocusedColor = "black";

// [تغيير/إضافة] تفعيل LayoutAnimation للـ Android
// هذا السطر ضروري لجعل الإنيميشن يعمل بسلاسة على أندرويد.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <View
    style={{
      marginTop: 8,
      padding: 16,
      borderRadius: 100,
    }}
  >
    <Image
      source={source}
      style={{
        width: iconSize,
        height: iconSize,
        tintColor: focused ? focusedColor : unfocusedColor,
      }}
      contentFit="contain"
    />
  </View>
);

export default function TabsLayout() {
  // استخدام Zustand store للحصول على حالة ظهور الـ Tab Bar
  const isTabBarVisible = useItemStore((state) => state.isTabBarVisible); // [تغيير] تأكد أن isTabBarVisible موجودة في useItemStore وتصل إليها هكذا

  // [تغيير/إضافة] تطبيق الإنيميشن عند تغيير isTabBarVisible
  // كلما تغيرت قيمة 'isTabBarVisible'، سيتم تهيئة LayoutAnimation
  // لتطبيق تأثير 'easeInEaseOut' على أي تغييرات في الـ layout التالية.
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [isTabBarVisible]); // [تغيير/إضافة] الإنيميشن هيتنفذ كل ما تتغير isTabBarVisible

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            left: 5,
            right: 5,
            elevation: 0,
            height: 60,
            paddingTop: 5,
            // [تغيير] التحكم في خاصية 'display' بناءً على حالة الـ Tab Bar من Zustand
            // هذا هو السطر الذي يجعل الـ Tab Bar يختفي أو يظهر بشكل عام لكل التابات.
            display: isTabBarVisible ? 'flex' : 'none',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={({ route }) => {
            return {
              tabBarHideOnKeyboard: true,
              headerSearchBarOptions: {
                placeholder: "Search",
              },
              headerRight: () => (
                <Image
                  source={require("../../assets/images/cart-shopping-solid.svg")}
                  style={{ width: 20, height: 20, marginRight: 10 }}
                />
              ),
              headerTitle: "Nubian",
              headerLeft: () => (
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={{ width: 50, height: 50, top: 3 }}
                />
              ),
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  source={require("../../assets/images/house-solid.svg")}
                  focused={focused}
                />
              ),
            };
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            tabBarStyle: { display: "none" },
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/cart-shopping-solid.svg")}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="explor"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/search-solid.svg")}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/user-solid.svg")}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}