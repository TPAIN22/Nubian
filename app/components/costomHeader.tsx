import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState, useRef } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useContext } from 'react';
import { LanguageContext } from '@/utils/LanguageContext';
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartBadge from "./CartBadge";
import Colors from "@/locales/brandColors";
import { useScrollStore } from "@/store/useScrollStore";

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function HeaderComponent() {
  const { language, setLanguage } = useContext(LanguageContext);
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { getToken } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);
  // Get scroll position from store
  const currentScrollY = useScrollStore((state) => state.scrollY);
  
  // Animated values for header transparency
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerBackgroundColor = useRef(new Animated.Value(0)).current;
  
  // Threshold for when header becomes opaque (faster transition at 20px)
  const SCROLL_THRESHOLD = 10;

  // حساب عدد العناصر في السلة
  useEffect(() => {
    const calculateCartCount = () => {
      if (cart?.products && Array.isArray(cart.products)) {
        const count = cart.products.reduce((total: number, item: any) => {
          return total + (item.quantity || 1);
        }, 0);
        setCartItemCount(count);
      } else {
        setCartItemCount(0);
      }
    };

    calculateCartCount();
  }, [cart]);

  // جلب بيانات السلة عند تحميل المكون
  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = await getToken();
        if (token) {
          await fetchCart(token);
        }
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
    outputRange: ['transparent', Colors.background],
  });

  const borderColor = headerOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', Colors.borderLight],
  });

  const shadowOpacity = headerOpacity.interpolate({
    inputRange: [0, 0.01],
    outputRange: [0, 0.01],
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
        barStyle={currentScrollY > SCROLL_THRESHOLD ? "dark-content" : "light-content"} 
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
                outputRange: ['rgba(255, 255, 255, 0.9)', Colors.gray[50]],
              }),
              borderColor: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255, 255, 255, 0.3)', Colors.borderLight],
              }),
            }
          ]}
        >
          <TouchableOpacity
            style={styles.searchBarInner}
            onPress={() => router.push("/(tabs)/explor")}
            activeOpacity={0.9}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.text.mediumGray : Colors.text.white} 
            />
            <Text 
              style={[
                styles.searchPlaceholder,
                { color: currentScrollY > SCROLL_THRESHOLD ? Colors.text.mediumGray : Colors.text.white }
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
            style={styles.iconButton}
            onPress={() => setLanguage(language.startsWith('ar') ? 'en' : 'ar')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="globe-outline" 
              size={22} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.text.dark : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(screens)/notification")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications-outline" 
              size={22} 
              color={currentScrollY > SCROLL_THRESHOLD ? Colors.text.dark : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(tabs)/cart")}
            activeOpacity={0.7}
          >
            <View style={styles.cartContainer}>
              <Ionicons 
                name="bag-outline" 
                size={22} 
                color={currentScrollY > SCROLL_THRESHOLD ? Colors.text.dark : Colors.text.white} 
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
        shadowOffset: { width: 0, height: 0.5 },
        shadowRadius: 0.5,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  logoSection: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logo: {
    width:28,
    height: 28,
  },
  searchBar: {
    flex: 1,
    height: 38,
    borderRadius: 21,
    marginHorizontal: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    width: '100%',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '400',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginLeft: 1,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  cartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});