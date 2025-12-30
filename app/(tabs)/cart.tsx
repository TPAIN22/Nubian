import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useCallback, useRef, useEffect, useState } from "react";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartItem from "../components/cartItem";
import Chekout from "../components/chekoutBotton";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import CheckOutModal from "../components/checkOutModal";
import { useRouter } from "expo-router";
import i18n from "@/utils/i18n";
import type { CouponValidationResult } from '../components/CouponInput';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from "@/locales/brandColors";

export default function CartScreen() {
  const { fetchCart, cart, isLoading, isUpdating, updateCartItemQuantity, removeFromCart } =
    useCartStore();
  const { getToken } = useAuth();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isProcessing] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);


  /*const handlePresentModalPress = useCallback(() => {
   router.push("../../components/checkOutModal");
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      bottomSheetModalRef.current?.dismiss();
    }
  }, []);*/

  const handlePresentModalPress = useCallback(() => {
    Alert.alert("قريبا ...", "تم نفاذ الكمية سيتم توفير منتجات جديدة قريبا", [{ text: "حسنا", onPress: () => { } }]);
  }, []);


  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const token = await getToken();
        if (token) {
          await fetchCart(token);
        }
      } catch (error) {
        console.log('Error loading cart:', error);
      }
    };
    fetchCartData();
  }, []);

  const increment = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      const normalizedSize = (item.size === null || item.size === undefined || item.size === 'null' || item.size === 'undefined' ? "" : (item.size || "")).trim();
      await updateCartItemQuantity(
        token,
        item.product._id,
        1,
        normalizedSize
      );
    }
  }, []);

  const decrement = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      const normalizedSize = (item.size === null || item.size === undefined || item.size === 'null' || item.size === 'undefined' ? "" : (item.size || "")).trim();
     
      await updateCartItemQuantity(
        token,
        item.product._id,
        -1,
        normalizedSize
      );
    }
  }, []);

  const deleteItem = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      const normalizedSize = (item.size === null || item.size === undefined || item.size === 'null' || item.size === 'undefined' ? "" : (item.size || "")).trim();
    
      await removeFromCart(token, item.product._id, normalizedSize);
    }
  }, []);

  const handleContinueShopping = () => {
    router.replace("/");
  };

  useEffect(() => {
    if (cart?.products) {
      const cartTotal = cart.totalPrice || 0;
    }
  }, [cart?.products?.length, cart?.totalPrice]);

  const isCartEmpty = !cart?.products || !Array.isArray(cart.products) || cart.products.length === 0;

  if (isLoading) {
    return (
      <View style={{flex:1 , alignItems:"center" ,justifyContent:'center'}}>
          <ActivityIndicator size="large" color={Colors.primary} />
      </View>
        
    );
  }

  if (isCartEmpty) {
    return (
      <View
        style={styles.emptyContainer}
      >
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
          </View>

          <Text style={styles.emptyTitle}>{i18n.t('cartEmpty')}</Text>
          <Text style={styles.emptySubtitle}>
            {i18n.t('cartEmptySubtitle')}
          </Text>

          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primary]}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueShoppingText}>{i18n.t('startShopping')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={{flex:1 , alignItems:"center" ,justifyContent:'center'}}>
      <ActivityIndicator size="large" color="#f0b745" />
      </View>
    );
  }

  const finalTotal = couponResult && couponResult.valid 
    ? Math.max(0, cart.totalPrice - (couponResult.discountType === 'percentage' 
        ? (cart.totalPrice * couponResult.discountValue / 100) 
        : couponResult.discountValue))
    : cart.totalPrice;

  return (
    <View style={styles.container}>
        <View style={styles.cartContent}>
          <FlatList
            data={Array.isArray(cart.products) ? cart.products : []}
            renderItem={({ item }) => (
              item && item.product && item.product._id ? (
                <View style={styles.cartItemWrapper}>
                  <CartItem
                    isUpdating={isUpdating}
                    item={item}
                    deleteItem={deleteItem}
                    increment={increment}
                    decrement={decrement}
                  />
                </View>
              ) : null
            )}
            keyExtractor={(item, idx) => (item && item.product && item.product._id) ? item.product._id : String(idx)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />  
        </View>
        <View style={styles.checkoutSection}>
          <Chekout
            total={finalTotal}
            handleCheckout={handlePresentModalPress}
          />
        </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginTop:10,
    flex: 1,
    backgroundColor: Colors.surface,
  },
  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    backgroundColor: undefined, 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12, // smaller padding
  },
  headerTitle: {
    fontSize: 18, // smaller font
    fontWeight: "700", // lighter weight
    color: Colors.text.darkGray, // dark text for light mode
    textShadowColor: Colors.overlayLight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemCountBadge: {
    backgroundColor: Colors.accent,
    minWidth: 22, // smaller badge
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCount: {
    fontSize: 12, // smaller font
    fontWeight: "600",
    color: Colors.text.white,
  },

  // Loading Styles
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainerLight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  loadingCard: {
    backgroundColor: Colors.background,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingCardLight: {
    backgroundColor: Colors.background,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.mediumGray,
    marginTop: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingTextLight: {
    fontSize: 16,
    color: Colors.text.darkGray,
    marginTop: 15,
    textAlign: "center",
    fontWeight: "600",
  },

  // Empty Cart Styles
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
   
  },
  emptyIcon: {
    fontSize: 60,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.darkGray,
    marginBottom: 15,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.veryLightGray,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  continueShoppingButton: {
    borderRadius: 6,
  },
  buttonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  continueShoppingText: {
    color: Colors.text.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Cart Content Styles
  cartContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  cartItemWrapper: {
    marginHorizontal: 15,
    padding:4,
    borderRadius: 8,
    margin:4
    
  },

  // Coupon Section
  couponSection: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  discountCard: {
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  discountGradient: {
    padding: 15,
    alignItems: 'center',
  },
  discountLabel: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  finalTotalLabel: {
    color: Colors.success,
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Checkout Section
  checkoutSection: {
    paddingHorizontal: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    
  },
  totalCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.mediumGray,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.accent,
  },
  originalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  originalPriceLabel: {
    fontSize: 14,
    color: Colors.text.lightGray,
  },
  originalPriceAmount: {
    fontSize: 16,
    color: Colors.text.lightGray,
    textDecorationLine: 'line-through',
  },

  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomSheetIndicator: {
    backgroundColor: Colors.gray[300],
    width: 50,
    height: 5,
    borderRadius: 2.5,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
});