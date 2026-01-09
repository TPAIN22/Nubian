import React, { useEffect, useRef } from "react";
import { Tabs } from "expo-router";
import {
  View,
  Pressable,
  StyleSheet,
  Text,
  Animated,
  Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useItemStore from "@/store/useItemStore";
import AppHeader from "../components/AppHeader";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import i18n from "@/utils/i18n";
import Colors from "@/locales/brandColors";
import { useTheme } from "@/providers/ThemeProvider";

interface TabIconProps {
  iconType: 'home' | 'cart' | 'search' | 'profile' | 'wishlist';
  focused: boolean;
  label: string;
}

// Custom Icon Components
const HomeIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CartIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 17.9 19 19 19C20.1 19 21 18.1 21 17V13M9 19.5C9.82843 19.5 10.5 18.8284 10.5 18C10.5 17.1716 9.82843 16.5 9 16.5C8.17157 16.5 7.5 17.1716 7.5 18C7.5 18.8284 8.17157 19.5 9 19.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WishlistIcon = ({ size, color }: { size: number; color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TabIcon: React.FC<TabIconProps> = ({ iconType, focused, label }) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.5)).current;
  const indicatorScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const backgroundScale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        tension: 280,
        friction: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(indicatorScale, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        tension: 180,
        friction: 10,
      }),
      Animated.spring(backgroundScale, {
        toValue: focused ? 1 : 0,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  }, [focused]);

  const iconSize = focused ? 26 : 24;
  const iconColor = focused ? theme.colors.primary : theme.colors.text.veryLightGray;

  const renderIcon = () => {
    switch (iconType) {
      case 'home':
        return <HomeIcon size={iconSize} color={iconColor} />;
      case 'cart':
        return <CartIcon size={iconSize} color={iconColor} />;
      case 'search':
        return <SearchIcon size={iconSize} color={iconColor} />;
      case 'profile':
        return <ProfileIcon size={iconSize} color={iconColor} />;
      case 'wishlist':
        return <WishlistIcon size={iconSize} color={iconColor} />;
      default:
        return <HomeIcon size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconBackground,
            {
              transform: [{ scale: backgroundScale }],
              opacity: backgroundScale,
              backgroundColor: theme.colors.primary + "15",
            },
          ]}
        />
        <View style={styles.iconContent}>
          {renderIcon()}
        </View>
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{ scaleX: indicatorScale }],
              opacity: indicatorScale,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const CustomTabButton = (props: BottomTabBarButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.tabButton,
        props.style,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.children}
      </Animated.View>
    </Pressable>
  );
};

export default function TabsLayout() {
  const { isTabBarVisible } = useItemStore();
  const insets = useSafeAreaInsets();
  const safeAreaBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
  const iconAreaHeight = 60; // Height for icon area only
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Tabs
        detachInactiveScreens
        screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            { 
              display: isTabBarVisible ? "flex" : "none",
              paddingBottom: safeAreaBottom,
              paddingTop: 0,
              height: iconAreaHeight + safeAreaBottom,
              minHeight: iconAreaHeight + safeAreaBottom,
              backgroundColor: theme.colors.surface,
              borderTopColor: isDark 
                ? `${theme.colors.borderLight}30` // ~19% opacity in dark mode for dimmer border
                : theme.colors.borderLight,
              borderTopWidth: 1,
              marginBottom: 0,
              ...Platform.select({
                ios: {
                  shadowColor: theme.colors.shadow,
                },
                android: {
                  backgroundColor: theme.colors.surface,
                },
              }),
            },
          ],
          tabBarButton: (props) => <CustomTabButton {...props} />,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text.veryLightGray,
          headerShadowVisible: false,
          headerStyle: [styles.header, { backgroundColor: theme.colors.cardBackground }],
          headerTintColor: theme.colors.text.gray,
          headerTitleStyle: { color: theme.colors.text.gray },
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
            header: () => <AppHeader />,
            headerTitleContainerStyle: styles.headerTitleContainer,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconType="home"
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
            headerStyle: { backgroundColor: theme.colors.cardBackground },
            headerTintColor: theme.colors.text.gray,
            headerTitleStyle: { color: theme.colors.text.gray },
            headerShadowVisible: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconType="cart"
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
                iconType="search"
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
                iconType="profile"
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
            headerStyle: { backgroundColor: theme.colors.cardBackground },
            headerTintColor: theme.colors.text.gray,
            headerTitleStyle: { color: theme.colors.text.gray },
            headerShadowVisible: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconType="wishlist"
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
    borderTopWidth: 0,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      },
      android: {
        elevation: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      },
    }),
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: '100%',
    borderRadius: 12,
    position: 'relative',
  },

  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    height: '100%',
  },

  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    overflow: 'visible',
  },

  iconContent: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    height: '100%',
  },

  iconBackground: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 28,
    height: 3,
    borderRadius: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Header Styles
  header: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },

  headerTitleContainer: {
    width: "100%",
  },
});