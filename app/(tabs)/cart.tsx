import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Text } from "@/components/ui/text";
import useCartStore from "@/store/useCartStore";
import CartItem from "../components/cartItem";
import Chekout from "../components/chekoutBotton";
import { normalizeAttributes } from "@/utils/cartUtils";
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import i18n from "@/utils/i18n";
import type { CouponValidationResult } from "../components/CouponInput";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/providers/ThemeProvider";
import useTracking from "@/hooks/useTracking";
import { useFocusEffect } from "@react-navigation/native";
import CheckOutModal from "../components/checkOutModal";

type CartLine = {
  product: { _id: string };
  attributes?: any;
  size?: string;
  quantity?: number;
};

export default function CartScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["90%"], []);
  const handleSheetDismiss = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

   const handlePresentModalPress = useCallback(() => {
      router.push("/checkout"); // أو المسار الصحيح حسب مكان الملف
    }, [router]);
  

  const {
    fetchCart,
    cart,
    isLoading,
    isUpdating,
    updateCartItemQuantity,
    removeFromCart,
    error,
    clearError,
  } = useCartStore();

  const [isProcessing] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  const { trackEvent } = useTracking();

  const isCartEmpty = !cart?.products || !Array.isArray(cart.products) || cart.products.length === 0;

  // ✅ دا الأفضل بدل useEffect([]): يحدث كل مرة الشاشة تتفتح
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          await fetchCart();
        } catch {
          // لو 404 cart not found تعاملها كـ empty cart (زي ما عندك)
        }
      })();

      return () => {
        mounted = false;
      };
    }, [fetchCart])
  );
  

  // ✅ helper ثابت لاستخراج attributes + size
  const getLineAttrs = useCallback((item: CartLine) => {
    const attrs = normalizeAttributes(item?.attributes);
    const size = attrs.size || item.size || "";
    return { attrs, size };
  }, []);

  const increment = useCallback(
    async (item: CartLine) => {
      if (!item?.product?._id) return;
      const { attrs, size } = getLineAttrs(item);

      await updateCartItemQuantity(item.product._id, 1, size, attrs);

      trackEvent("cart_qty_increase", {
        productId: item.product._id,
        screen: "cart",
      });
    },
    [updateCartItemQuantity, getLineAttrs, trackEvent]
  );

  const decrement = useCallback(
    async (item: CartLine) => {
      if (!item?.product?._id) return;
      const { attrs, size } = getLineAttrs(item);

      await updateCartItemQuantity(item.product._id, -1, size, attrs);

      trackEvent("cart_qty_decrease", {
        productId: item.product._id,
        screen: "cart",
      });
    },
    [updateCartItemQuantity, getLineAttrs, trackEvent]
  );

  const deleteItem = useCallback(
    async (item: CartLine) => {
      if (!item?.product?._id) return;
      const { attrs, size } = getLineAttrs(item);

      trackEvent("remove_from_cart", {
        productId: item.product._id,
        screen: "cart",
      });

      await removeFromCart(item.product._id, size, attrs);
    },
    [removeFromCart, getLineAttrs, trackEvent]
  );

  const handleContinueShopping = useCallback(() => {
    router.replace("/");
  }, [router]);

  // ✅ total after coupon
  const finalTotal = useMemo(() => {
    const base = cart?.totalPrice ?? 0;
    if (!couponResult?.valid || !couponResult.discountValue) return base;

    if (couponResult.discountType === "percentage") {
      return Math.max(0, base - (base * couponResult.discountValue) / 100);
    }
    return Math.max(0, base - couponResult.discountValue);
  }, [cart?.totalPrice, couponResult]);

  // Loading
  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error (لكن ما نظهره لو cart فاضي)
  if (error && !isCartEmpty) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyContent}>
          <Text style={[styles.emptyTitle, { color: colors.error }]}>{error}</Text>

          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={() => {
              clearError();
              fetchCart();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[colors.primary, colors.primary]} style={styles.buttonGradient}>
              <Text style={[styles.continueShoppingText, { color: colors.text.white }]}>
                {i18n.t("tryAgain") || "حاول مرة أخرى"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty cart
  if (isCartEmpty) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.emptyContent}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={styles.emptyIcon}>🛒</Text>
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
            {i18n.t("cartEmpty") || "السلة فارغة"}
          </Text>

          <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
            {i18n.t("cartEmptySubtitle") || "ابدأ التسوق وأضف منتجات للسلة"}
          </Text>

          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={handleContinueShopping}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[colors.primary, colors.primary]} style={styles.buttonGradient}>
              <Text style={[styles.continueShoppingText, { color: colors.text.white }]}>
                {i18n.t("startShopping") || "ابدأ التسوق"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // processing
  if (isProcessing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.cartContent, { backgroundColor: colors.surface }]}>
        <FlatList
          data={Array.isArray(cart.products) ? cart.products : []}
          renderItem={({ item }) =>
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
          }
          keyExtractor={(item: any, idx) => (item?.product?._id ? item.product._id : String(idx))}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={[styles.checkoutSection, { backgroundColor: colors.surface }]}>
        <Chekout total={finalTotal} handleCheckout={handlePresentModalPress} /> 
      </View>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.gray?.[400] ?? "#9CA3AF" }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <CheckOutModal handleClose={handleSheetDismiss} />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

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
    marginBottom: 15,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  cartContent: {
    flex: 1,
  },
  listContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  cartItemWrapper: {
    marginHorizontal: 15,
    padding: 4,
    borderRadius: 8,
    margin: 4,
  },

  checkoutSection: {
    paddingHorizontal: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
});
