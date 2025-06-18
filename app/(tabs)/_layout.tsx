import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  View,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import useItemStore from "@/store/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useCartStore } from "@/store/useCartStore";
import HeaderComponent from "../components/costomHeader";


const CONSTANTS = {
  iconSize: 24,
  headerIconSize: 20,
  logoSize: 36,
  tabBarRadius: 20,
  tabBarMargin: 12,
  colors: {
    focused: "#e98c22",
    unfocused: "#6B7280",
    background: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",
    border: "#E5E7EB",
    notification: "#EF4444",
  },
};
// Enable layout animations on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TabIconProps {
  source: any;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ source, focused, label }) => (
  <View style={styles.tabIconContainer}>
    <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
      <Image
        source={source}
        style={[
          styles.tabIcon,
          {
            tintColor: focused
              ? CONSTANTS.colors.focused
              : CONSTANTS.colors.unfocused,
          },
        ]}
        contentFit="contain"
      />
    </View>
  </View>
);

const CustomTabButton: React.FC<any> = (props) => (
  <Pressable
    {...props}
    android_ripple={{ color: "transparent" }}
    style={styles.tabButton}
  >
    {props.children}
  </Pressable>
);



export default function TabsLayout() {
  const { isTabBarVisible } = useItemStore();

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, [isTabBarVisible]);

  return (
    <>
      <StatusBar style="dark" backgroundColor={CONSTANTS.colors.background} />
      <Tabs
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarButton: CustomTabButton,
          tabBarActiveTintColor: CONSTANTS.colors.focused,
          tabBarInactiveTintColor: CONSTANTS.colors.unfocused,
          headerShadowVisible: false,
          headerStyle: styles.header,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarHideOnKeyboard: true,
            header: HeaderComponent,
            headerTitleContainerStyle: styles.headerTitleContainer,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/house-solid.svg")}
                focused={focused}
                label="الرئيسية"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="cart"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/cart-shopping-solid.svg")}
                focused={focused}
                label="السلة"
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
                label="استكشاف"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerShown: true,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/user-solid.svg")}
                focused={focused}
                label="الملف الشخصي"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 20 : 10,
    left: CONSTANTS.tabBarMargin,
    right: CONSTANTS.tabBarMargin,
    backgroundColor: CONSTANTS.colors.background,
    borderRadius: CONSTANTS.tabBarRadius,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: CONSTANTS.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: CONSTANTS.colors.border,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 16,
  },

  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapper: {
    padding: 12,
    borderRadius: 20,
  },

  iconWrapperFocused: {
    backgroundColor: CONSTANTS.colors.focused + "15",
  },

  tabIcon: {
    width: CONSTANTS.iconSize,
    height: CONSTANTS.iconSize,
  },

  // Header Styles
  header: {
    backgroundColor: CONSTANTS.colors.background,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: CONSTANTS.colors.border,
  },

  headerTitleContainer: {
    width: "100%",
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  headerLogo: {
    width: CONSTANTS.logoSize,
    height: CONSTANTS.logoSize,
    borderRadius: 8,
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CONSTANTS.colors.border,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    fontSize: 14,
    textAlign: "right",
    color: "#111827",
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  iconWithBadge: {
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: CONSTANTS.colors.notification,
    borderRadius: 4,
  },
});
