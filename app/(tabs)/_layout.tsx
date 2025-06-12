import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import { 
  View, 
  LayoutAnimation, 
  Platform, 
  UIManager, 
  Pressable,
  StyleSheet ,
  TextInput
} from "react-native";
import { StatusBar } from "expo-status-bar";
import useItemStore from "@/store/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";

const CONSTANTS = {
  iconSize: 24,
  headerIconSize: 20,
  logoSize: 40,
  tabBarRadius: 15,
  tabBarMargin: 8,
  colors: {
    focused: "#e98c22",
    unfocused: "#6B7280",
    background: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",
  }
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TabIcon = ({ source, focused, label }: { source: any; focused: boolean; label: string }) => (
  <View style={styles.tabIconContainer}>
    <View style={[
      styles.iconWrapper,
      focused && styles.iconWrapperFocused
    ]}>
      <Image
        source={source}
        style={[
          styles.tabIcon,
          { tintColor: focused ? CONSTANTS.colors.focused : CONSTANTS.colors.unfocused }
        ]}
        contentFit="contain"
      />
    </View>
  </View>
);

const CustomTabButton = (props: any) => (
  <Pressable
    {...props}
    android_ripple={{ color: 'transparent' }} 
    style={styles.tabButton}
  >
    {props.children}
  </Pressable>
);

export default function TabsLayout() {
  const {isTabBarVisible} = useItemStore()

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
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Tabs
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            {
              display: isTabBarVisible ? "flex" : "none",
            }
          ],
          tabBarButton: CustomTabButton,
          tabBarActiveTintColor: CONSTANTS.colors.focused,
          tabBarInactiveTintColor: CONSTANTS.colors.unfocused,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={({ route }) => ({
            tabBarHideOnKeyboard: true,
          headerTitle(props) {
            return (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" ,gap: 10}}>
              <Image source={require("../../assets/images/icon.png")} style={{width: 36, height: 36}}/>
               <TextInput
                placeholder="بحث"
                style={{width: 250 , borderWidth: 1 ,borderColor: "#A9A9A937",paddingHorizontal: 10, borderRadius: 20 ,height: 40}}/>
                <View style={{flexDirection: "row"}}>
                <Ionicons name="notifications-outline" size={26} color="black" style={{marginRight: 10}} />
                <Ionicons name="cart-outline" size={26} color="black" style={{marginRight: 10}} />
                </View>
              </View>
            );
          },
           
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/house-solid.svg")}
                focused={focused}
                label="الرئيسية"
              />
            ),
          })}
        />

        <Tabs.Screen
          name="cart"
          options={{
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
    left: CONSTANTS.tabBarMargin,
    right: CONSTANTS.tabBarMargin,
    backgroundColor: CONSTANTS.colors.background,
    borderRadius: CONSTANTS.tabBarRadius,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 20 : 5,
    shadowColor: CONSTANTS.colors.shadow,
  
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapper: {
    padding: 12,
    borderRadius: 25,
  },
  iconWrapperFocused: {
    backgroundColor: CONSTANTS.colors.focused + '15',
  },

  tabIcon: {
    width: CONSTANTS.iconSize,
    height: CONSTANTS.iconSize,
  },
  header: {
    backgroundColor: CONSTANTS.colors.background,
    elevation: 0,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    width: '100%',
  },

  headerButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 8,
  },

  headerIcon: {
    width: CONSTANTS.headerIconSize,
    height: CONSTANTS.headerIconSize,
    tintColor: '#374151',
  },

  logoContainer: {
    marginLeft: 5,
    padding: 5,
  },

  logo: {
    width: CONSTANTS.logoSize,
    height: CONSTANTS.logoSize,
    borderRadius: 8,
    marginTop: 5,
  },
});