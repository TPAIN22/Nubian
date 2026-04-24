import { useCallback, useState } from "react";
import {
  View,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text } from "@/components/ui/text";
import useCartStore from "@/store/useCartStore";
import CartItem from "@/components/cartItem";
import Checkout from "@/components/CheckoutButton";
import { normalizeAttributes } from "@/utils/cartUtils";
import { useRouter } from "expo-router";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { useTracking } from "@/hooks/useTracking";
import { useFocusEffect } from "@react-navigation/native";

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
  const handlePresentModalPress = useCallback(() => {
    router.push("/checkout");
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

  const { trackEvent } = useTracking();

  const isCartEmpty = !cart?.products || !Array.isArray(cart.products) || cart.products.length === 0;

  // ✅ دا الأفضل بدل useEffect([]): يحدث كل مرة الشاشة تتفتح
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await fetchCart();
        } catch {
          // لو 404 cart not found تعاملها كـ empty cart (زي ما عندك)
        }
      })();

      return () => {
        // noop
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
  const finalTotal = cart?.totalPrice ?? 0;

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
            <View style={[styles.buttonGradient, { backgroundColor: colors.primary }]}>
              <Text style={[styles.continueShoppingText, { color: colors.text.white }]}>
                {i18n.t("tryAgain") || "حاول مرة أخرى"}
              </Text>
            </View>
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
            <View style={[styles.buttonGradient, { backgroundColor: colors.primary }]}>
              <Text style={[styles.continueShoppingText, { color: colors.text.white }]}>
                {i18n.t("startShopping") || "ابدأ التسوق"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
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
          keyExtractor={(item: any, idx) => {
            const productId = item?.product?._id || item?.product?.id || String(idx);
            const { attrs } = getLineAttrs(item);
            const attrString = Object.entries(attrs).sort().map(([k, v]) => `${k}:${v}`).join("|");
            return attrString ? `${productId}|${attrString}` : productId;
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <View style={[styles.checkoutSection, { backgroundColor: colors.surface }]}>
        <Checkout total={finalTotal} handleCheckout={handlePresentModalPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    lineHeight: 60,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 38,
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
    lineHeight: 28,
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
