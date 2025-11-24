import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useContext } from 'react';
import { LanguageContext } from '@/utils/LanguageContext';
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartBadge from "./CartBadge";

const { width } = Dimensions.get('window');

export default function HeaderComponent() {
  const { language, setLanguage } = useContext(LanguageContext);
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { getToken } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

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

  return (
    <View style={styles.header}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/nubianLogo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push("/(tabs)/explor")}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchPlaceholder}>
          {i18n.t('searchPlaceholder')}
        </Text>
      </TouchableOpacity>

      {/* User Actions */}
      <View style={styles.userActions}>
        {/* Language Toggle */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setLanguage(language.startsWith('ar') ? 'en' : 'ar')}
          accessibilityLabel={i18n.t('changeLanguage')}
        >
          <Ionicons name="globe-outline" size={22} color="#000" />
        </TouchableOpacity>
        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(screens)/notification")}
        >
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>

        {/* Cart with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(tabs)/cart")}
          activeOpacity={0.7}
        >
          <View style={styles.cartContainer}>
            <Ionicons name="cart-outline" size={24} color="#000" />
            <CartBadge size={20} fontSize={10} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
    backgroundColor:"#fff"
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderWidth:0.5,
    borderColor:"#000",
    backgroundColor:"#FFFFFFE3"
   
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#000',
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  cartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});