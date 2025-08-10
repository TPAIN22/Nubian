import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { useCallback, useRef, useEffect, useState } from "react";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import CartItem from "../components/cartItem";
import Chekout from "../components/chekoutBotton";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import CheckOutModal from "../components/checkOutModal";
import { useRouter } from "expo-router";
import i18n from "@/utils/i18n";
import CouponInput from '../components/CouponInput';
import type { CouponValidationResult } from '../components/CouponInput';
import { LinearGradient } from 'expo-linear-gradient';

export default function CartScreen() {
  const { fetchCart, cart, isLoading, isUpdating, updateCartItemQuantity, removeFromCart } =
    useCartStore();
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isProcessing] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      bottomSheetModalRef.current?.dismiss();
    }
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
      <View style={styles.centeredContainerLight}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingCardLight}>
          <ActivityIndicator size="large" color="#30a1a7" />
          <Text style={styles.loadingTextLight}>{i18n.t('loadingCart')}</Text>
        </View>
      </View>
    );
  }

  if (isCartEmpty) {
    return (
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={styles.emptyContainer}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
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
              colors={['#30a1a7', '#268a94']}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueShoppingText}>{i18n.t('startShopping')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.centeredContainerLight}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingCardLight}>
          <ActivityIndicator size="large" color="#f0b745" />
          <Text style={styles.loadingTextLight}>{i18n.t('processingOrder')}</Text>
        </View>
      </View>
    );
  }

  const finalTotal = couponResult && couponResult.valid 
    ? Math.max(0, cart.totalPrice - (couponResult.discountType === 'percentage' 
        ? (cart.totalPrice * couponResult.discountValue / 100) 
        : couponResult.discountValue))
    : cart.totalPrice;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a252f" />
      <BottomSheetModalProvider>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.t('cartTitle')}</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCount}>
                {cart.products.length}
              </Text>
            </View>
          </View>
        </LinearGradient>

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
          
          <View style={styles.couponSection}>
            <CouponInput
              products={cart.products.map((item: any) => ({ productId: item.product._id, categoryId: item.product.category }))}
              userId={user?.id || ""}
              onValidate={setCouponResult}
            />
          </View>
          
          {couponResult && couponResult.valid && (
            <View style={styles.discountCard}>
              <LinearGradient
                colors={['#d4edda', '#c3e6cb']}
                style={styles.discountGradient}
              >
                <Text style={styles.discountLabel}>
                  💰 خصم: {couponResult.discountValue} {couponResult.discountType === 'percentage' ? '%' : 'ج.س'}
                </Text>
                <Text style={styles.finalTotalLabel}>
                  المجموع بعد الخصم: {finalTotal} ج.س
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.checkoutSection}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>المجموع الكلي</Text>
              <Text style={styles.totalAmount}>{finalTotal} ج.س</Text>
            </View>
            {couponResult && couponResult.valid && (
              <View style={styles.originalPriceRow}>
                <Text style={styles.originalPriceLabel}>السعر الأصلي</Text>
                <Text style={styles.originalPriceAmount}>{cart.totalPrice} ج.س</Text>
              </View>
            )}
          </View>
          
          <Chekout
            total={finalTotal}
            handleCheckout={handlePresentModalPress}
          />
        </View>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          index={0}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <CheckOutModal
              handleClose={() => bottomSheetModalRef.current?.dismiss()}
            />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    backgroundColor: undefined, // Remove any default background
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
    color: "#222f3e", // dark text for light mode
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemCountBadge: {
    backgroundColor: "#30a1a7",
    minWidth: 22, // smaller badge
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCount: {
    fontSize: 12, // smaller font
    fontWeight: "600",
    color: "#ffffff",
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
    backgroundColor: "#f8f9fa",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  loadingCardLight: {
    backgroundColor: "#ffffff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  loadingTextLight: {
    fontSize: 16,
    color: "#222f3e",
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
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyIcon: {
    fontSize: 60,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 15,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  continueShoppingButton: {
    borderRadius: 25,
    shadowColor: "#30a1a7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 25,
  },
  continueShoppingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Cart Content Styles
  cartContent: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  cartItemWrapper: {
    marginHorizontal: 15,
    marginVertical: 5,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    shadowColor: "#000",
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
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  finalTotalLabel: {
    color: '#155724',
    fontWeight: 'bold',
    fontSize: 18,
  },

  // Checkout Section
  checkoutSection: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  totalCard: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#495057",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#30a1a7",
  },
  originalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  originalPriceLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  originalPriceAmount: {
    fontSize: 16,
    color: "#6c757d",
    textDecorationLine: 'line-through',
  },

  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  bottomSheetIndicator: {
    backgroundColor: "#dee2e6",
    width: 50,
    height: 5,
    borderRadius: 2.5,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
});