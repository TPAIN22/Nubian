import { useCallback, useState, useMemo } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import useCartStore from "@/store/useCartStore";
import CartItem from "@/components/cartItem";
import Checkout from "@/components/CheckoutButton";
import { normalizeAttributes } from "@/utils/cartUtils";
import { formatMoney } from "@/utils/priceUtils";
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
    isItemUpdating,
    isCouponPending,
    updateCartItemQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
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
    }, [fetchCart])
  );


  // ✅ helper ثابت لاستخراج attributes + size
  const getLineAttrs = useCallback((item: CartLine) => {
    const attrs = normalizeAttributes(item?.attributes);
    const size = attrs.size || item.size || "";
    return { attrs, size };
  }, []);

  const keyExtractor = useCallback(
    (item: any, idx: number) => {
      const productId = item?.product?._id || item?.product?.id || String(idx);
      const { attrs } = getLineAttrs(item);
      const attrString = Object.entries(attrs).sort().map(([k, v]) => `${k}:${v}`).join("|");
      return attrString ? `${productId}|${attrString}` : productId;
    },
    [getLineAttrs]
  );

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
    (item: CartLine) => {
      if (!item?.product?._id) return;

      Alert.alert(
        i18n.t("cart_removeConfirmTitle") || "Remove item?",
        i18n.t("cart_removeConfirmMessage") || "This will remove the item from your cart.",
        [
          { text: i18n.t("cancel") || "Cancel", style: "cancel" },
          {
            text: i18n.t("delete") || "Delete",
            style: "destructive",
            onPress: async () => {
              const { attrs, size } = getLineAttrs(item);
              trackEvent("remove_from_cart", {
                productId: item.product._id,
                screen: "cart",
              });
              await removeFromCart(item.product._id, size, attrs);
            },
          },
        ]
      );
    },
    [removeFromCart, getLineAttrs, trackEvent]
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCart();
    } catch {
      // store already surfaces the error
    } finally {
      setRefreshing(false);
    }
  }, [fetchCart]);

  const { width: screenWidth } = useWindowDimensions();
  const imageSize = useMemo(
    () => (screenWidth < 360 ? 80 : screenWidth < 600 ? 100 : 120),
    [screenWidth]
  );

  const handleContinueShopping = useCallback(() => {
    router.replace("/");
  }, [router]);

  // ✅ total after coupon
  const finalTotal = cart?.totalPrice ?? 0;
  const subtotal = cart?.subtotal ?? finalTotal;
  const discount = cart?.discount ?? 0;
  const shipping = cart?.shipping ?? 0;
  const appliedCoupon = cart?.appliedCoupon ?? null;
  const cartCurrency = cart?.currencyCode;

  const formatAmount = useCallback(
    (amount: number) =>
      cartCurrency
        ? formatMoney({ amount, currency: cartCurrency })
        : formatMoney(amount),
    [cartCurrency]
  );

  const [couponInput, setCouponInput] = useState("");

  const handleApplyCoupon = useCallback(async () => {
    const code = couponInput.trim();
    if (!code) return;
    try {
      await applyCoupon(code);
      setCouponInput("");
      trackEvent("coupon_apply", { code, screen: "cart" });
    } catch {
      // Store surfaces the error message; keep input so the user can edit it.
    }
  }, [applyCoupon, couponInput, trackEvent]);

  const handleRemoveCoupon = useCallback(async () => {
    try {
      await removeCoupon();
      trackEvent("coupon_remove", { screen: "cart" });
    } catch {
      // Store surfaces the error.
    }
  }, [removeCoupon, trackEvent]);

  // Loading: only show full-screen spinner on first load (no persisted/optimistic data yet).
  if (isLoading && !cart) {
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
          renderItem={({ item }) => {
            if (!item || !item.product || !item.product._id) return null;
            const { attrs } = getLineAttrs(item);
            const lineUpdating = isItemUpdating(item.product._id, attrs);
            return (
              <View style={styles.cartItemWrapper}>
                <CartItem
                  isUpdating={lineUpdating}
                  item={item}
                  imageSize={imageSize}
                  deleteItem={deleteItem}
                  increment={increment}
                  decrement={decrement}
                />
              </View>
            );
          }}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      </View>

      <View style={[styles.checkoutSection, { backgroundColor: colors.surface }]}>
        {appliedCoupon ? (
          <View style={[styles.couponAppliedRow, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.couponAppliedTextWrap}>
              <Text style={[styles.couponAppliedLabel, { color: colors.success }]}>
                {(i18n.t("cart_couponApplied") || "Coupon applied")}: {appliedCoupon.code}
              </Text>
              {appliedCoupon.type === "percentage" ? (
                <Text style={[styles.couponAppliedSub, { color: colors.text.veryLightGray }]}>
                  {appliedCoupon.value}%
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={handleRemoveCoupon}
              disabled={isCouponPending}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("cart_couponRemove") || "Remove coupon"}
              style={styles.couponRemoveBtn}
            >
              {isCouponPending ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={[styles.couponRemoveText, { color: colors.error }]}>✕</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.couponInputRow}>
            <TextInput
              value={couponInput}
              onChangeText={(t) => setCouponInput(t.toUpperCase())}
              placeholder={i18n.t("cart_couponPlaceholder") || "Coupon code"}
              placeholderTextColor={colors.text.veryLightGray}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isCouponPending}
              style={[
                styles.couponInput,
                { borderColor: colors.text.veryLightGray, color: colors.text.gray },
              ]}
            />
            <TouchableOpacity
              onPress={handleApplyCoupon}
              disabled={!couponInput.trim() || isCouponPending}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("cart_couponApply") || "Apply coupon"}
              style={[
                styles.couponApplyBtn,
                {
                  backgroundColor:
                    !couponInput.trim() || isCouponPending ? colors.text.veryLightGray : colors.primary,
                },
              ]}
            >
              {isCouponPending ? (
                <ActivityIndicator size="small" color={colors.text.white} />
              ) : (
                <Text style={[styles.couponApplyText, { color: colors.text.white }]}>
                  {i18n.t("cart_couponApply") || "Apply"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.breakdownBlock}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text.veryLightGray }]}>
              {i18n.t("cart_subtotal") || "Subtotal"}
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text.gray }]}>
              {formatAmount(subtotal)}
            </Text>
          </View>

          {discount > 0 ? (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.success }]}>
                {i18n.t("cart_discount") || "Discount"}
                {appliedCoupon ? ` (${appliedCoupon.code})` : ""}
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                −{formatAmount(discount)}
              </Text>
            </View>
          ) : null}

          {shipping > 0 ? (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.text.veryLightGray }]}>
                {i18n.t("cart_shipping") || "Shipping"}
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.text.gray }]}>
                {formatAmount(shipping)}
              </Text>
            </View>
          ) : null}
        </View>

        <Checkout
          total={finalTotal}
          currency={cart?.currencyCode}
          handleCheckout={handlePresentModalPress}
        />
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
    paddingTop: 12,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  couponApplyBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  couponApplyText: {
    fontSize: 14,
    fontWeight: "700",
  },
  couponAppliedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  couponAppliedTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  couponAppliedLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  couponAppliedSub: {
    fontSize: 12,
  },
  couponRemoveBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  couponRemoveText: {
    fontSize: 18,
    fontWeight: "700",
  },

  breakdownBlock: {
    paddingVertical: 6,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
