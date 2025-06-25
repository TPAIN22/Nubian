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
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useCartStore } from "@/store/useCartStore";

const { width } = Dimensions.get('window');

export default function HeaderComponent() {
  const router = useRouter();
  const { cart } = useCartStore();

  const cartItemCount = cart?.products?.reduce((total: number, item: any) => {
    return total + (item.quantity || 1);
  }, 0) || 0;

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
        >
          <Ionicons name="cart-outline" size={24} color="#666" />
          {cartItemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Text>
            </View>
          )}
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#e98c22',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});