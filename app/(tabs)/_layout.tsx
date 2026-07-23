import { useCallback, useEffect, useRef } from "react";
import type { FC } from "react";
import { Tabs } from "expo-router";
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Text } from "@/components/ui/text";
import Reanimated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useItemStore from "@/store/useItemStore";
import { CartBadge } from "@/components/cart/CartBadge";
import { setCartTarget } from "@/components/cart/cartFeedback";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";

type IconType = "home" | "cart" | "search" | "profile" | "wishlist";

const ACTIVE_FLEX = 1.7;
const INACTIVE_FLEX = 1;

/* ---------------- Motion ---------------- */

/**
 * Tab-bar motion is deliberately restrained: it is chrome the customer sees on
 * every screen, so it should acknowledge a tap and get out of the way rather
 * than perform. All of it stays on the UI thread via Reanimated.
 */
/** Press-down scale of a tab. Shallow — a nudge, not a squash. */
const PRESS_SCALE = 0.96;
/** Overdamped so the tab settles on release instead of springing back. */
const PRESS_SPRING = { damping: 24, stiffness: 340 };
/** Focus crossfade (icon opacity + the active pill tint). */
const FOCUS_MS = 200;
/** How much the active icon grows. */
const FOCUS_SCALE = 0.03;
/**
 * The active slot's flex change. A timing curve, not a spring: springing the
 * width made every sibling tab drift past its resting position and back on
 * each switch.
 */
const SLOT_MS = 240;

interface RouteMeta {
  iconType: IconType;
  labelKey: string;
}

// route name → icon + label mapping
const ROUTE_META: Record<string, RouteMeta> = {
  index: { iconType: "home", labelKey: "home" },
  cart: { iconType: "cart", labelKey: "cart" },
  explore: { iconType: "search", labelKey: "explore" },
  profile: { iconType: "profile", labelKey: "profile" },
  wishlist: { iconType: "wishlist", labelKey: "wishlist" },
};

/* ---------------- Icons ---------------- */

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

const renderIcon = (iconType: IconType, size: number, color: string) => {
  switch (iconType) {
    case "home":
      return <HomeIcon size={size} color={color} />;
    case "cart":
      return <CartIcon size={size} color={color} />;
    case "search":
      return <SearchIcon size={size} color={color} />;
    case "profile":
      return <ProfileIcon size={size} color={color} />;
    case "wishlist":
      return <WishlistIcon size={size} color={color} />;
  }
};

/* ---------------- Tab Item ---------------- */

// Animated Cairo text for the focused label (fade in/out on focus change).
const AnimatedText = Reanimated.createAnimatedComponent(Text);

interface TabItemProps {
  iconType: IconType;
  label: string;
  focused: boolean;
  onPress: () => void;
  /**
   * Renders the animated cart count. The badge subscribes to the cart store
   * itself, so a quantity change re-renders 18×18 points instead of the whole
   * tab bar (which is what passing a `badgeCount` prop down used to do).
   */
  showCartBadge?: boolean;
}

const TabItem: FC<TabItemProps> = ({
  iconType,
  label,
  focused,
  onPress,
  showCartBadge,
}) => {
  const { theme } = useTheme();
  const iconRef = useRef<View | null>(null);

  // press feedback + focus progress, both on the UI thread via Reanimated
  const pressScale = useSharedValue(1);
  const focusProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: FOCUS_MS });
  }, [focused, focusProgress]);

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + FOCUS_SCALE * focusProgress.value }],
    opacity: 0.55 + 0.45 * focusProgress.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(PRESS_SCALE, PRESS_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  const iconColor = focused
    ? theme.colors.primary
    : theme.colors.text.veryLightGray;

  // Publish the cart icon's window rect so `flyToCart` knows where to land.
  // Re-measured after a focus change because the active tab's flex animation
  // slides every slot, and `onLayout` doesn't fire for a pure position shift.
  const measureCartTarget = useCallback(() => {
    if (!showCartBadge) return;
    const node = iconRef.current;
    if (!node || typeof node.measureInWindow !== "function") return;
    node.measureInWindow((x, y, width, height) => {
      if (typeof x !== "number" || Number.isNaN(x)) return;
      setCartTarget({ x, y, width, height });
    });
  }, [showCartBadge]);

  useEffect(() => {
    if (!showCartBadge) return undefined;
    const timer = setTimeout(measureCartTarget, 380);
    return () => clearTimeout(timer);
  }, [focused, showCartBadge, measureCartTarget]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      style={[
        styles.tabItem,
        focused ? styles.tabItemFocused : styles.tabItemUnfocused,
      ]}
    >
      <Reanimated.View
        style={[
          styles.itemInner,
          focused
            ? { backgroundColor: theme.colors.primary + "15" }
            : null,
          innerStyle,
        ]}
      >
        <Reanimated.View style={iconWrapStyle}>
          <View
            ref={iconRef}
            onLayout={measureCartTarget}
            style={styles.iconContent}
          >
            {renderIcon(iconType, 24, iconColor)}
            {showCartBadge && (
              <CartBadge
                color={theme.colors.primary}
                borderColor={theme.colors.surface}
              />
            )}
          </View>
        </Reanimated.View>

        {focused && (
          <AnimatedText
            bold
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            numberOfLines={1}
            style={[
              styles.label,
              { color: theme.colors.primary, marginLeft: 8 },
            ]}
          >
            {label}
          </AnimatedText>
        )}
      </Reanimated.View>
    </Pressable>
  );
};

/* ---------------- Custom Tab Bar ---------------- */

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTabBarVisible } = useItemStore();

  // The active-tab flex change is animated per-slot via Reanimated's
  // LinearTransition layout animation (see the slot Reanimated.View below) —
  // it runs on the UI thread and doesn't have LayoutAnimation's new-arch
  // deprecation/glitchiness.
  if (!isTabBarVisible) return null;

  const safeAreaBottom = Math.max(insets.bottom, Platform.OS === "ios" ? 20 : 8);

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: safeAreaBottom,
          borderTopColor: isDark
            ? `${theme.colors.borderLight}30`
            : theme.colors.borderLight,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.tabBarRow}>
        {state.routes.map((route, i) => {
          const meta = ROUTE_META[route.name];
          if (!meta) return null;

          const focused = state.index === i;
          const { options } = descriptors[route.key]!;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const labelText =
            (typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : null) ??
            i18n.t(meta.labelKey) ??
            meta.labelKey;

          return (
            <Reanimated.View
              key={route.key}
              layout={LinearTransition.duration(SLOT_MS)}
              style={[
                styles.tabSlot,
                { flex: focused ? ACTIVE_FLEX : INACTIVE_FLEX },
              ]}
            >
              <TabItem
                iconType={meta.iconType}
                label={labelText}
                focused={focused}
                onPress={onPress}
                showCartBadge={meta.iconType === "cart"}
              />
            </Reanimated.View>
          );
        })}
      </View>
    </View>
  );
};

/* ---------------- Layout ---------------- */

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Tabs
        detachInactiveScreens
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarHideOnKeyboard: true,
          headerShadowVisible: false,
          headerStyle: [styles.header, { backgroundColor: theme.colors.cardBackground }],
          headerTintColor: theme.colors.text.gray,
          headerTitleStyle: { color: theme.colors.text.gray },
          lazy: true,
          freezeOnBlur: true,
        }}
        initialRouteName="index"
      >
        <Tabs.Screen name="index" options={{ headerShown: false }} />
        <Tabs.Screen
          name="cart"
          options={{
            headerShown: false,
            headerStyle: { backgroundColor: theme.colors.cardBackground },
          }}
        />
        <Tabs.Screen name="explore" options={{ headerShown: false }} />
        <Tabs.Screen name="profile" options={{ headerShown: false }} />
        <Tabs.Screen
          name="wishlist"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.cardBackground },
          }}
        />
      </Tabs>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      },
      android: {
        elevation: 16,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
      },
    }),
  },

  tabBarRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },

  tabSlot: {
    height: "100%",
    paddingHorizontal: 2,
  },

  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  tabItemFocused: {},
  tabItemUnfocused: {},

  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    minWidth: 44,
  },

  iconContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  /* The cart count badge now lives in `components/cart/CartBadge`. */

  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  header: {
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
});
