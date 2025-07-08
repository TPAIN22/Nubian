import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  I18nManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartBadge from "./CartBadge";

const { width } = Dimensions.get('window');

export default function HeaderComponent() {
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
        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(screens)/notification")}
        >
          <Ionicons name="notifications-outline" size={24} color="#666" />
        </TouchableOpacity>

        {/* Cart with Badge */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/(tabs)/cart")}
          activeOpacity={0.7}
        >
          <View style={styles.cartContainer}>
            <Ionicons name="cart-outline" size={24} color="#666" />
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingTop: 40,
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
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
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