import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useContext } from 'react';
import { LanguageContext } from '@/utils/LanguageContext';
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartBadge from "./CartBadge";
import Colors from "@/locales/brandColors";
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function HeaderComponent() {
  const { language, setLanguage } = useContext(LanguageContext);
  const router = useRouter();
  const { fetchCart } = useCartStore();
  const { theme } = useTheme();
  const Colors = theme.colors;
  // Get scroll position from store
  const currentScrollY = useScrollStore((state) => state.scrollY);
  
  // Animated values for header transparency
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerBackgroundColor = useRef(new Animated.Value(0)).current;
  
  // Threshold for when header becomes opaque (faster transition at 20px)
  const SCROLL_THRESHOLD = 10;


  // جلب بيانات السلة عند تحميل المكون
  useEffect(() => {
    const loadCart = async () => {
      try {
        await fetchCart();
      } catch (error) {
        console.log('Error loading cart:', error);
      }
    };

    loadCart();
  }, []);

  // Animate header based on scroll position
  useEffect(() => {
    const opacity = Math.min(currentScrollY / SCROLL_THRESHOLD, 1);
    
    // Fast spring animation for quick transition
    Animated.parallel([
      Animated.spring(headerOpacity, {
        toValue: opacity,
        tension: 200,
        friction: 7,
        useNativeDriver: false,
      }),
      Animated.spring(headerBackgroundColor, {
        toValue: opacity,
        tension: 200,
        friction: 7,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentScrollY, headerOpacity, headerBackgroundColor]);

  const backgroundColor = headerBackgroundColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', Colors.cardBackground],
  });

  const borderColor = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', Colors.borderLight],
  });

  const shadowOpacity = headerOpacity.interpolate({
    inputRange: [0, 0.01],
    outputRange: [0, 0.15],
  });

  return (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          backgroundColor,
          ...Platform.select({
            ios: {
              shadowOpacity,
            },
          }),
        }
      ]}
    >
      <StatusBar 
        barStyle={currentScrollY > SCROLL_THRESHOLD ? (theme.mode === 'dark' ? 'light-content' : 'dark-content') : "light-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      <Animated.View 
        style={[
          styles.header,
          {
            borderBottomWidth: headerOpacity,
            borderBottomColor: borderColor,
          }
        ]}
      >
        {/* Logo Section */}
        <TouchableOpacity 
          style={styles.logoSection}
          onPress={() => router.push("/(tabs)/index")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/images/nubianLogo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </TouchableOpacity>

        {/* Search Bar - Prominent & Elegant */}
        <Animated.View
          style={[
            styles.searchBar,
            {
              backgroundColor: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)', Colors.cardBackground],
              }),
              borderColor: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(163, 126, 44, 0.4)', Colors.borderLight],
              }),
              borderWidth: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [1.5, 1.5],
              }),
            }
          ]}
        >
          <TouchableOpacity
            style={styles.searchBarInner}
            onPress={() => router.push("/(tabs)/explor")}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.primary : Colors.text.white} 
            />
            <Text 
              style={[
                styles.searchPlaceholder,
                { color: currentScrollY > SCROLL_THRESHOLD ? Colors.text.secondary : Colors.text.white }
              ]} 
              numberOfLines={1}
            >
              {i18n.t('searchPlaceholder') || 'Search products...'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              currentScrollY > SCROLL_THRESHOLD && styles.iconButtonActive
            ]}
            onPress={() => setLanguage(language.startsWith('ar') ? 'en' : 'ar')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="globe-outline" 
              size={22} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.primary : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              currentScrollY > SCROLL_THRESHOLD && styles.iconButtonActive
            ]}
            onPress={() => router.push("/(screens)/notification")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications-outline" 
              size={22} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.primary : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.cartButton,
              currentScrollY > SCROLL_THRESHOLD && styles.iconButtonActive
            ]}
            onPress={() => router.push("/(tabs)/cart")}
            activeOpacity={0.7}
          >
            <View style={styles.cartContainer}>
              <Ionicons 
                name="bag-outline" 
                size={22} 
                color={currentScrollY > SCROLL_THRESHOLD ? Colors.primary : Colors.text.white} 
              />
              <CartBadge size={16} fontSize={8} />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: STATUS_BAR_HEIGHT,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  logoSection: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 32,
    height: 32,
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 24,
    marginHorizontal: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary + '20',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        shadowOpacity: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
    width: '100%',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(163, 126, 44, 0.15)',
  },
  cartButton: {
    marginLeft: 2,
  },
  cartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
});