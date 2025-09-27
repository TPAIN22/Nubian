import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import {
  View,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  Animated,
} from "react-native";
import useItemStore from "@/store/useItemStore";
import HeaderComponent from "../components/costomHeader";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import i18n from "@/utils/i18n";

const CONSTANTS = {
  iconSize: 22,
  activeIconSize: 24,
  colors: {
    primary: "#f0b745", // Modern indigo
    secondary: "#f0b745", // Purple accent
    tertiary: "#f0b745", // Pink accent
    background: "#FAFAFA",
    cardBackground: "#FFFFFF",
    unfocused: "#6B7280",
    text: "#1F2937",
    border: "#E5E7EB",
    indicator: "#f0b745", // Emerald for notifications
  },
  gradients: {
    primary: ["#f0b745", "#f0b745"],
    secondary: ["#f0b745", "#f0b745"],
    accent: ["#f0b745", "#f0b745"],
  },
};

interface TabIconProps {
  source: any;
  focused: boolean;
  label: string;
  index: number;
}

const TabIcon: React.FC<TabIconProps> = ({ source, focused, label, index }) => {
  const [scaleAnim] = useState(new Animated.Value(focused ? 1.1 : 1));
  const [slideAnim] = useState(new Animated.Value(focused ? -2 : 0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(slideAnim, {
        toValue: focused ? -3 : 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
    ]).start();
  }, [focused]);

  const getGradientColor = () => {
    const gradients = [
      CONSTANTS.colors.primary,
      CONSTANTS.colors.secondary,
      CONSTANTS.colors.tertiary,
      CONSTANTS.colors.indicator,
      CONSTANTS.colors.secondary,
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Animated.View 
      style={[
        styles.tabIconContainer,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}
    >
      <View style={[
        styles.iconWrapper, 
        focused && [
          styles.iconWrapperFocused,
          { backgroundColor: getGradientColor() + "15" }
        ]
      ]}>
        <View style={[
          styles.iconCircle,
          focused && [
            styles.iconCircleFocused,
            { borderColor: getGradientColor() }
          ]
        ]}>
          <Image
            source={source}
            style={[
              styles.tabIcon,
              {
                width: focused ? CONSTANTS.activeIconSize : CONSTANTS.iconSize,
                height: focused ? CONSTANTS.activeIconSize : CONSTANTS.iconSize,
                tintColor: focused ? getGradientColor() : CONSTANTS.colors.unfocused,
              },
            ]}
            contentFit="contain"
          />
        </View>
        {focused && (
          <View style={[
            styles.activeIndicator,
            { backgroundColor: getGradientColor() }
          ]} />
        )}
      </View>
      <Text 
        style={[
          styles.tabIconLabel,
          {
            color: focused ? getGradientColor() : CONSTANTS.colors.unfocused,
            fontWeight: focused ? "600" : "500",
            transform: [{ scale: focused ? 1.05 : 1 }]
          }
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const CustomTabButton = (props: BottomTabBarButtonProps & { index: number }) => {
  const [rippleAnim] = useState(new Animated.Value(0));

  const handlePressIn = () => {
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(rippleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    props.onPress?.({} as any);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabButton, props.style]}
    >
      <Animated.View
        style={[
          styles.rippleEffect,
          {
            opacity: rippleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.1],
            }),
            transform: [{
              scale: rippleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />
      {props.children}
    </Pressable>
  );
};

export default function TabsLayout() {
  const { isTabBarVisible } = useItemStore();

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.spring,
        property: LayoutAnimation.Properties.opacity,
        springDamping: 0.8,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.8,
      },
    });
  }, [isTabBarVisible]);


  return (
    <View style={{ flex: 1 }}>
      <Tabs
        detachInactiveScreens
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            { display: isTabBarVisible ? 'flex' : 'none' }
          ],
          tabBarButton: (props) => <CustomTabButton {...props} index={0} />,
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
            headerTransparent: true,
            header: () => <HeaderComponent />,
            headerTitleContainerStyle: styles.headerTitleContainer,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                source={require("../../assets/images/house-solid.svg")}
                focused={focused}
                label={i18n.t("home")}
                index={0}
              />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} index={0} />,
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
                index={1}
              />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} index={1} />,
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
                index={2}
              />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} index={2} />,
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
                index={3}
              />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} index={3} />,
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
                index={4}
              />
            ),
            tabBarButton: (props) => <CustomTabButton {...props} index={4} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    backgroundColor: CONSTANTS.colors.cardBackground,
    borderTopWidth: 0,
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 8,
    elevation: 0,
    shadowOpacity: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24, },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 20,
    minHeight: 55,
    position: 'relative',
  },

  rippleEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: CONSTANTS.colors.primary,
    borderRadius: 16,
  },

  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    zIndex: 1,
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
  },

  iconWrapperFocused: {
    transform: [{ scale: 1.05 }],
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'transparent',
  },

  iconCircleFocused: {
    borderWidth: 2,
  },

  tabIcon: {
    width: CONSTANTS.iconSize,
    height: CONSTANTS.iconSize,
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
  },

  tabIconLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
    letterSpacing: 0.3,
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