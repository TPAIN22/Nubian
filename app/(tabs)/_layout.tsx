import React from "react";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import useItemStore from "@/store/useItemStore";
import HeaderComponent from "../components/costomHeader";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import i18n from "@/utils/i18n";
import Colors from "@/locales/brandColors";

const CONSTANTS = {
  iconSize: 22,
  activeIconSize: 26,
  colors: {
    primary: Colors.primary,
    background: Colors.surface,
    cardBackground: Colors.background,
    unfocused: Colors.gray[400],
    border: Colors.gray[100],
  },
};

interface TabIconProps {
  source: any;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ source, focused, label }) => {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperFocused,
        ]}
      >
        <Image
          source={source}
          style={{
            width: focused ? CONSTANTS.activeIconSize : CONSTANTS.iconSize,
            height: focused ? CONSTANTS.activeIconSize : CONSTANTS.iconSize,
            tintColor: focused
              ? CONSTANTS.colors.primary
              : CONSTANTS.colors.unfocused,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      {!focused && (
        <Text
          style={[
            styles.tabIconLabel,
            { color: CONSTANTS.colors.unfocused },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const CustomTabButton = (props: BottomTabBarButtonProps) => {
  return (
    <Pressable
      onPress={props.onPress}
      style={[styles.tabButton, props.style]}
    >
      {props.children}
    </Pressable>
  );
};

export default function TabsLayout() {
  const { isTabBarVisible } = useItemStore();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        detachInactiveScreens
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            { display: isTabBarVisible ? "flex" : "none" },
          ],
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarActiveTintColor: CONSTANTS.colors.primary,
          tabBarInactiveTintColor: CONSTANTS.colors.unfocused,
          headerShadowVisible: false,
          headerStyle: styles.header,
          lazy: true,
          freezeOnBlur: true,
        }}
        initialRouteName="index"
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarHideOnKeyboard: true,
            headerShadowVisible: false,
            headerTransparent: false,
            header: () => <HeaderComponent />,
            headerTitleContainerStyle: styles.headerTitleContainer,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/house-solid.svg")}
                focused={focused}
                label={i18n.t("home")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            headerShown: true,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/cart-shopping-solid.svg")}
                focused={focused}
                label={i18n.t("cart")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="explor"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/search-solid.svg")}
                focused={focused}
                label={i18n.t("explore")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/user-solid.svg")}
                focused={focused}
                label={i18n.t("profile")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="wishlist"
          options={{
            headerShown: true,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/heart-solid.svg")}
                focused={focused}
                label={i18n.t("wishlist") || "Wishlist"}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: CONSTANTS.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: CONSTANTS.colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
   
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 50,
  },

  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: 22,
    },

  iconWrapperFocused: {
    backgroundColor: CONSTANTS.colors.primary + "12",
  },

  tabIconLabel: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // Header Styles
  header: {
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: CONSTANTS.colors.background,
    borderBottomWidth: 0,
  },

  headerTitleContainer: {
    width: "100%",
  },
});