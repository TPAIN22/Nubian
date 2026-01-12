import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
  } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { I18nManager } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useCartQuantity } from '../../store/useCartStore';
import i18n from '@/utils/i18n';
import { useScrollStore } from '@/store/useScrollStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  showMenu?: boolean;
  onMenuPress?: () => void;
  showNotifications?: boolean;
  onNotificationPress?: () => void;
  showQuickActions?: boolean;
  maxQuickActions?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 10;
const ICON_SIZE = 22;
const SEARCH_ICON_SIZE = 18;

const SHADOWS = {
  searchBar: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }),
  badge: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

function useHeaderState() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentScrollY = useScrollStore((state) => state.scrollY);
  
  const isScrolled = currentScrollY > SCROLL_THRESHOLD;
  const isRTL = I18nManager.isRTL;
  const isDark = theme.mode === 'dark';
  
  const topPadding = insets.top;

  const statusBarStyle = isScrolled 
    ? (isDark ? 'light' : 'dark') 
    : 'light';

  const iconColor = isScrolled ? theme.colors.text.primary : '#FFFFFF';

  const headerGradient = isScrolled
    ? [theme.colors.surface, theme.colors.surface]
    : ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0)'];

  const glassBackground = isScrolled
    ? isDark
      ? 'rgba(18, 18, 18, 0.85)'
      : 'rgba(255, 255, 255, 0.85)'
    : 'transparent';

  return {
    isScrolled,
    isRTL,
    isDark,
    topPadding,
    statusBarStyle,
    iconColor,
    headerGradient,
    glassBackground,
    colors: theme.colors,
  };
}

function useHeaderActions(onNotificationPress?: () => void) {
  const router = useRouter();

  const handleLogoPress = () => {}; // No routing on logo press
  const handleSearchPress = () => router.push('/(tabs)/explor');
  const handleCartPress = () => router.push('/(tabs)/cart');
  
  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(screens)/notification');
    }
  };

  return {
    handleLogoPress,
    handleSearchPress,
    handleCartPress,
    handleNotificationPress,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const HeaderLogo = memo<{ isScrolled: boolean; onPress: () => void }>(
  ({ isScrolled, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.logoContainer}
      activeOpacity={0.7}
    >
      <Image
        source={require('../../assets/images/nubianLogo.png')}
        style={[
          styles.logo,
          {
            opacity: isScrolled ? 1 : 0.95,
            tintColor: isScrolled ? undefined : '#FFFFFF',
          },
        ]}
        contentFit="contain"
      />
    </TouchableOpacity>
  )
);
HeaderLogo.displayName = 'HeaderLogo';

const SearchBar = memo<{
  onPress: () => void;
  isRTL: boolean;
  primaryColor: string;
  textColor: string;
}>(({ onPress, isRTL, primaryColor, textColor }) => {
  const placeholder = i18n.t('searchPlaceholder') || 'ابحث عن منتج، متجر، أو فئة';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.searchBarCenter,
        {
          borderColor: pressed ? primaryColor : 'rgb(241, 214, 214)',
          opacity: pressed ? 0.95 : 1,
        },
        SHADOWS.searchBar,
      ]}
    >
      <View style={[
        styles.searchInnerContainer,
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <View style={[styles.searchIconContainer, { backgroundColor: primaryColor + '15' }]}>
          <Ionicons name="search" size={SEARCH_ICON_SIZE} color={'#000000'} />
        </View>
        <Text style={[styles.searchPlaceholder, { color: textColor }]} numberOfLines={1}>
          {placeholder}
        </Text>
      </View>
    </Pressable>
  );
});
SearchBar.displayName = 'SearchBar';

const CartBadge = memo<{ quantity: number; badgeColor: string }>(
  ({ quantity, badgeColor }) => {
    if (quantity <= 0) return null;

    return (
      <View style={styles.cartBadgeContainer}>
        <LinearGradient
          colors={[badgeColor, `${badgeColor}dd`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cartBadge}
        >
          <Text style={styles.cartBadgeText}>
            {quantity > 99 ? '99+' : quantity}
          </Text>
        </LinearGradient>
      </View>
    );
  }
);
CartBadge.displayName = 'CartBadge';

const IconButton = memo<{
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  isScrolled: boolean;
  isDark: boolean;
  badge?: React.ReactNode;
}>(({ icon, onPress, color, isScrolled, isDark, badge }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.iconButton,
      {
        backgroundColor: isScrolled
          ? isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)'
          : 'rgba(255, 255, 255, 0.15)',
        transform: [{ scale: pressed ? 0.92 : 1 }],
        borderWidth: isScrolled ? 1 : 0,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      },
    ]}
  >
    <Ionicons name={icon} size={ICON_SIZE} color={color} />
    {badge}
  </Pressable>
));
IconButton.displayName = 'IconButton';

const HeaderActions = memo<{
  showNotifications: boolean;
  onNotificationPress: () => void;
  onCartPress: () => void;
  iconColor: string;
  isScrolled: boolean;
  isDark: boolean;
  isRTL: boolean;
  cartQuantity: number;
  primaryColor: string;
}>(({
  showNotifications,
  onNotificationPress,
  onCartPress,
  iconColor,
  isScrolled,
  isDark,
  isRTL,
  cartQuantity,
  primaryColor,
}) => (
  <View style={[styles.rightActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
    {showNotifications && (
      <IconButton
        icon="notifications-outline"
        onPress={onNotificationPress}
        color={iconColor}
        isScrolled={isScrolled}
        isDark={isDark}
      />
    )}
    <IconButton
      icon="bag-outline"
      onPress={onCartPress}
      color={iconColor}
      isScrolled={isScrolled}
      isDark={isDark}
      badge={<CartBadge quantity={cartQuantity} badgeColor={primaryColor} />}
    />
  </View>
));
HeaderActions.displayName = 'HeaderActions';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const AppHeader: React.FC<AppHeaderProps> = ({
  showNotifications = true,
  onNotificationPress,
}) => {
  const state = useHeaderState();
  const actions = useHeaderActions(onNotificationPress);
  const cartQuantity = useCartQuantity();

  return (
    <View style={[styles.container, { paddingTop: state.topPadding }]}>
      <StatusBar style={state.statusBarStyle} />

      {/* Gradient background */}
      <LinearGradient
        colors={state.headerGradient as [string, string]}
        style={[styles.gradientOverlay, { backgroundColor: state.glassBackground }]}
        pointerEvents="none"
      />

      {/* iOS blur effect */}
      {state.isScrolled && Platform.OS === 'ios' && (
        <BlurView
          intensity={80}
          tint={state.isDark ? 'dark' : 'light'}
          style={styles.blurView}
        />
      )}

      {/* Main content */}
      <View style={[styles.topBar, { flexDirection: state.isRTL ? 'row-reverse' : 'row' }]}>
        <HeaderLogo isScrolled={state.isScrolled} onPress={actions.handleLogoPress} />

        <SearchBar
          onPress={actions.handleSearchPress}
          isRTL={state.isRTL}
          primaryColor={state.colors.primary}
          textColor={state.colors.text.secondary}
        />

        <HeaderActions
          showNotifications={showNotifications}
          onNotificationPress={actions.handleNotificationPress}
          onCartPress={actions.handleCartPress}
          iconColor={state.iconColor}
          isScrolled={state.isScrolled}
          isDark={state.isDark}
          isRTL={state.isRTL}
          cartQuantity={cartQuantity}
          primaryColor={state.colors.primary}
        />
      </View>

      {/* Bottom border */}
      {state.isScrolled && (
        <View
          style={[
            styles.bottomBorder,
            {
              backgroundColor: state.isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 56,
    position: 'relative',
    zIndex: 1,
    maxWidth: '100%',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoContainer: {
    width: 50,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // Remove this after debugging: backgroundColor: 'red',
  },
  logo: {
    width: 50,
    height: 34,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    // Remove this after debugging: backgroundColor: 'blue',
  },
  cartBadgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  cartBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2.5,
    borderColor: '#fff',
    ...SHADOWS.badge,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchBarCenter: {
    flex: 1,
    height: 46,
    marginHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    justifyContent: 'center',
    ...SHADOWS.searchBar,
  },
  searchInnerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFBB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 10,
    minWidth: '65%',
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Memoization
// ─────────────────────────────────────────────────────────────────────────────

const arePropsEqual = (prevProps: AppHeaderProps, nextProps: AppHeaderProps) => {
  return (
    prevProps.showMenu === nextProps.showMenu &&
    prevProps.showNotifications === nextProps.showNotifications &&
    prevProps.showQuickActions === nextProps.showQuickActions &&
    prevProps.maxQuickActions === nextProps.maxQuickActions &&
    prevProps.onMenuPress === nextProps.onMenuPress &&
    prevProps.onNotificationPress === nextProps.onNotificationPress
  );
};

export default memo(AppHeader, arePropsEqual);