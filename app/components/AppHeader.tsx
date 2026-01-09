import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { I18nManager } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useCartQuantity } from '@/store/useCartStore';
import i18n from '@/utils/i18n';
import { useScrollStore } from '@/store/useScrollStore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface AppHeaderProps {
  showMenu?: boolean;
  onMenuPress?: () => void;
  showNotifications?: boolean;
  onNotificationPress?: () => void;
  showQuickActions?: boolean;
  maxQuickActions?: number;
}

// Elegant animated cart badge with gradient
const CartBadgeComponent = memo<{ quantity: number; badgeColor: string }>(
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
CartBadgeComponent.displayName = 'CartBadgeComponent';

const AppHeader: React.FC<AppHeaderProps> = ({
  showMenu = false,
  onMenuPress,
  showNotifications = true,
  onNotificationPress,
  showQuickActions = false,
  maxQuickActions = 10,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const currentScrollY = useScrollStore((state) => state.scrollY);
  const SCROLL_THRESHOLD = 10;
  const isScrolled = currentScrollY > SCROLL_THRESHOLD;
  
  const colors = useMemo(() => theme.colors, [theme.colors]);
  const themeMode = useMemo(() => theme.mode, [theme.mode]);
  const isRTL = I18nManager.isRTL;

  const cartQuantity = useCartQuantity();
  
  const searchPlaceholder = useMemo(
    () => i18n.t('searchPlaceholder') || 'ابحث عن منتج، متجر، أو فئة',
    []
  );

  const handleLogoPress = useCallback(() => {
    router.push('/(tabs)/index');
  }, [router]);

  const handleSearchPress = useCallback(() => {
    router.push('/(tabs)/explor');
  }, [router]);

  const handleCartPress = useCallback(() => {
    router.push('/(tabs)/cart');
  }, [router]);

  const handleNotificationPress = useCallback(() => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/(screens)/notification');
    }
  }, [router, onNotificationPress]);

  const topPadding = useMemo(
    () => Math.max(insets.top, Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0),
    [insets.top]
  );

  // Enhanced gradient background when not scrolled
  const headerGradient = useMemo(
    () => isScrolled 
      ? [colors.surface, colors.surface]
      : ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0)'],
    [isScrolled, colors.surface]
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: topPadding,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      },
    ],
    [topPadding]
  );

  const topBarStyle = useMemo(
    () => [styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }],
    [isRTL]
  );

  const rightActionsStyle = useMemo(
    () => [styles.rightActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }],
    [isRTL]
  );

  const statusBarStyle = useMemo(
    () => isScrolled ? (themeMode === 'dark' ? 'light-content' : 'dark-content') : 'light-content',
    [themeMode, isScrolled]
  );

  // Glass morphism effect for scrolled state
  const glassMorphStyle = useMemo(
    () => ({
      backgroundColor: isScrolled 
        ? themeMode === 'dark' 
          ? 'rgba(18, 18, 18, 0.85)'
          : 'rgba(255, 255, 255, 0.85)'
        : 'transparent',
      backdropFilter: isScrolled ? 'blur(20px)' : 'none',
    }),
    [isScrolled, themeMode]
  );

  // Icon button with elegant backdrop
  const iconButtonStyle = useCallback((pressed: boolean) => [
    styles.iconButton,
    {
      backgroundColor: isScrolled 
        ? themeMode === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.05)'
        : 'rgba(255, 255, 255, 0.15)',
      transform: [{ scale: pressed ? 0.92 : 1 }],
      borderWidth: isScrolled ? 1 : 0,
      borderColor: themeMode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.05)',
    }
  ], [isScrolled, themeMode]);

  const iconColor = useMemo(
    () => isScrolled ? colors.text.primary : '#FFFFFF',
    [isScrolled, colors.text.primary]
  );

  return (
    <View style={containerStyle}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient background overlay */}
      <LinearGradient
        colors={headerGradient}
        style={[styles.gradientOverlay, glassMorphStyle]}
        pointerEvents="none"
      />

      {/* Glass morphism blur effect when scrolled */}
      {isScrolled && Platform.OS === 'ios' && (
        <BlurView
          intensity={80}
          tint={themeMode === 'dark' ? 'dark' : 'light'}
          style={styles.blurView}
        />
      )}

      <View style={topBarStyle}>
        {/* Logo with elegant scaling */}
        <TouchableOpacity
          onPress={handleLogoPress}
          style={styles.logoContainer}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/images/nubianLogo.png')}
            style={[
              styles.logo,
              { 
                opacity: isScrolled ? 1 : 0.95,
                tintColor: isScrolled ? undefined : '#FFFFFF'
              }
            ]}
            contentFit="contain"
          />
        </TouchableOpacity>

        {/* Premium search bar with white background */}
        <Pressable
          onPress={handleSearchPress}
          style={({ pressed }) => [
            styles.searchBarCenter,
            {
              backgroundColor: '#FFFFFF',
              borderColor: pressed ? colors.primary : 'rgba(0, 0, 0, 0.08)',
              borderWidth: 1,
              opacity: pressed ? 0.95 : 1,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              ...Platform.select({
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
            },
          ]}
        >
          <View style={[
            styles.searchIconContainer,
            {
              backgroundColor: colors.primary + '15',
            }
          ]}>
            <Ionicons
              name="search"
              size={18}
              color={colors.primary}
            />
          </View>
          <Text
            style={[
              styles.searchPlaceholder,
              {
                color: colors.text.secondary,
              },
            ]}
            numberOfLines={1}
          >
            {searchPlaceholder}
          </Text>
        </Pressable>

        {/* Action buttons with modern styling */}
        <View style={rightActionsStyle}>
          {showNotifications && (
            <Pressable
              onPress={handleNotificationPress}
              style={({ pressed }) => iconButtonStyle(pressed)}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={iconColor}
              />
            </Pressable>
          )}

          <Pressable
            onPress={handleCartPress}
            style={({ pressed }) => [
              iconButtonStyle(pressed),
              { position: 'relative' }
            ]}
          >
            <Ionicons
              name="bag-outline"
              size={22}
              color={iconColor}
            />
            <CartBadgeComponent quantity={cartQuantity} badgeColor={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Subtle bottom border when scrolled */}
      {isScrolled && (
        <View
          style={[
            styles.bottomBorder,
            {
              backgroundColor: themeMode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
    minHeight: 56,
    position: 'relative',
    zIndex: 1,
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
    width: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  logo: {
    width: 100,
    height: 34,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    ...Platform.select({
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
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  searchBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    minHeight: 46,
    maxHeight: 46,
    overflow: 'hidden',
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: 0,
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