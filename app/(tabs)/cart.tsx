import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import useCartStore from "@/store/useCartStore";
import {
  CartItemCard,
  CheckoutFooter,
  CouponField,
  EmptyCartState,
  InlineAlert,
  PriceBreakdown,
  Skeleton,
  SkeletonCartRow,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";
import { normalizeAttributes } from "@/utils/cartUtils";
import { formatMoney } from "@/utils/priceUtils";
import i18n from "@/utils/i18n";
import { useTracking } from "@/hooks/useTracking";
import type { CouponValidationResult } from "@/components/CouponInput";

type CartLine = {
  product: { _id: string };
  attributes?: any;
  size?: string;
  quantity?: number;
};

export default function CartScreen() {
  const t = useCheckoutTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useTracking();
  const { width: screenWidth } = useWindowDimensions();
  const imageSize = useMemo(
    () => (screenWidth < 360 ? 80 : screenWidth < 600 ? 92 : 108),
    [screenWidth],
  );

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

  const isCartEmpty =
    !cart?.products ||
    !Array.isArray(cart.products) ||
    cart.products.length === 0;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          await fetchCart();
        } catch {
          // 404 → empty cart, surfaced through store state
        }
      })();
    }, [fetchCart]),
  );

  const getLineAttrs = useCallback((item: CartLine) => {
    const attrs = normalizeAttributes(item?.attributes);
    const size = attrs.size || item.size || "";
    return { attrs, size };
  }, []);

  const keyExtractor = useCallback(
    (item: any, idx: number) => {
      const productId =
        item?.product?._id || item?.product?.id || String(idx);
      const { attrs } = getLineAttrs(item);
      const attrString = Object.entries(attrs)
        .sort()
        .map(([k, v]) => `${k}:${v}`)
        .join("|");
      return attrString ? `${productId}|${attrString}` : productId;
    },
    [getLineAttrs],
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
    [updateCartItemQuantity, getLineAttrs, trackEvent],
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
    [updateCartItemQuantity, getLineAttrs, trackEvent],
  );

  const handleRemove = useCallback(
    (item: CartLine) => {
      if (!item?.product?._id) return;

      Alert.alert(
        i18n.t("cart_removeConfirmTitle") || "Remove item?",
        i18n.t("cart_removeConfirmMessage") ||
          "This will remove the item from your cart.",
        [
          { text: i18n.t("cancel") || "Cancel", style: "cancel" },
          {
            text: i18n.t("delete") || "Remove",
            style: "destructive",
            onPress: async () => {
              const { attrs, size } = getLineAttrs(item);
              trackEvent("remove_from_cart", {
                productId: item.product._id,
                screen: "cart",
              });
              try {
                await removeFromCart(item.product._id, size, attrs);
                toast.success(
                  i18n.t("cart_itemRemoved") || "Removed from cart",
                );
              } catch {
                const msg =
                  useCartStore.getState().error ||
                  i18n.t("cart_removeError");
                toast.error(msg);
              }
            },
          },
        ],
      );
    },
    [removeFromCart, getLineAttrs, trackEvent],
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearError();
    try {
      await fetchCart();
    } catch {
      // store already surfaces the error
    } finally {
      setRefreshing(false);
    }
  }, [fetchCart, clearError]);

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
    [cartCurrency],
  );

  const itemCount = useMemo(() => {
    if (typeof cart?.totalQuantity === "number") return cart.totalQuantity;
    if (!Array.isArray(cart?.products)) return 0;
    return cart.products.reduce(
      (sum: number, p: any) => sum + (Number(p?.quantity) || 1),
      0,
    );
  }, [cart]);

  const handleCheckout = useCallback(() => {
    router.push("/checkout");
  }, [router]);

  const handleContinueShopping = useCallback(() => {
    router.replace("/");
  }, [router]);

  const handleApplyCoupon = useCallback(
    async (result: CouponValidationResult) => {
      try {
        await applyCoupon(result.code);
        trackEvent("coupon_apply", { code: result.code, screen: "cart" });
        toast.success(i18n.t("cart_couponApplied") || "Coupon applied");
      } catch {
        const msg =
          useCartStore.getState().error || i18n.t("cart_couponError");
        toast.error(msg);
      }
    },
    [applyCoupon, trackEvent],
  );

  const handleRemoveCoupon = useCallback(async () => {
    try {
      await removeCoupon();
      trackEvent("coupon_remove", { screen: "cart" });
      toast.success(i18n.t("cart_couponRemoved") || "Coupon removed");
    } catch {
      const msg =
        useCartStore.getState().error || i18n.t("cart_couponRemoveError");
      toast.error(msg);
    }
  }, [removeCoupon, trackEvent]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (!item || !item.product || !item.product._id) return null;
      const { attrs } = getLineAttrs(item);
      const busy = isItemUpdating(item.product._id, attrs);
      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          layout={LinearTransition.springify().damping(20)}
        >
          <CartItemCard
            item={item}
            imageSize={imageSize}
            busy={busy}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={handleRemove}
          />
        </Animated.View>
      );
    },
    [
      getLineAttrs,
      isItemUpdating,
      imageSize,
      increment,
      decrement,
      handleRemove,
    ],
  );

  // Local coupon shape for the in-cart CouponField. The cart store treats coupons
  // as opaque codes, so we synthesize a result envelope when one is already applied.
  const localCouponResult: CouponValidationResult | null = useMemo(() => {
    if (!appliedCoupon) return null;
    return {
      code: appliedCoupon.code,
      valid: true,
      type: appliedCoupon.type,
      value: appliedCoupon.value,
      discountAmount: discount,
      originalAmount: subtotal,
      finalAmount: finalTotal,
      message: "applied",
    };
  }, [appliedCoupon, discount, finalTotal, subtotal]);

  // === Loading skeleton ===
  if (isLoading && !cart) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: t.surface, paddingTop: insets.top + spacing.sm },
        ]}
      >
        <View style={styles.headerRow}>
          <Skeleton width={120} height={28} />
          <Skeleton width={48} height={14} />
        </View>
        <View style={{ paddingHorizontal: spacing.base, gap: spacing.md }}>
          {[0, 1, 2].map(i => (
            <SkeletonCartRow key={i} />
          ))}
        </View>
      </View>
    );
  }

  // === Error state (with cart context) ===
  if (error && !isCartEmpty) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: t.surface, paddingTop: insets.top + spacing.sm },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: t.textPrimary }]}>
            {i18n.t("cart") || "Cart"}
          </Text>
        </View>
        <View style={styles.centerWrap}>
          <InlineAlert
            tone="error"
            title={i18n.t("somethingWentWrong") || "Something went wrong"}
            message={String(error)}
          />
        </View>
      </View>
    );
  }

  // === Empty state ===
  if (isCartEmpty) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: t.surface, paddingTop: insets.top + spacing.sm },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: t.textPrimary }]}>
            {i18n.t("cart") || "Cart"}
          </Text>
        </View>
        <EmptyCartState
          ctaLabel={i18n.t("startShopping") || "Start shopping"}
          onCta={handleContinueShopping}
        />
      </View>
    );
  }

  // === Populated state ===
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.surface, paddingTop: insets.top + spacing.sm },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {i18n.t("cart") || "Cart"}
        </Text>
        <Text style={[styles.itemCount, { color: t.textTertiary }]}>
          {itemCount} {itemCount === 1 ? i18n.t("item") || "item" : i18n.t("items") || "items"}
        </Text>
      </View>

      <FlatList
        data={(cart?.products as any[]) ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        style={styles.flex}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.accent}
            colors={[t.accent]}
          />
        }
        ListFooterComponent={
          <View style={styles.footerInfo}>
            <View
              style={[
                styles.couponWrap,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <Text
                style={[styles.sectionLabel, { color: t.textTertiary }]}
              >
                {i18n.t("cart_havePromo") || "Have a promo code?"}
              </Text>
              <CouponField
                products={(cart?.products ?? []).map((it: any) => ({
                  productId: it.product._id,
                  categoryId: it.product.category,
                }))}
                orderAmount={subtotal}
                applied={localCouponResult}
                format={formatAmount}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
              {isCouponPending ? (
                <Text
                  style={[styles.helper, { color: t.textTertiary }]}
                >
                  {i18n.t("loading") || "Loading…"}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.summaryWrap,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <Text
                style={[styles.sectionLabel, { color: t.textTertiary }]}
              >
                {i18n.t("orderSummary") || "Order summary"}
              </Text>
              <PriceBreakdown
                pricing={{
                  subtotal,
                  shippingFee: shipping,
                  discount,
                  total: finalTotal,
                }}
                itemCount={itemCount}
                format={formatAmount}
                couponLabel={appliedCoupon?.code}
                showTrustNote={false}
              />
            </View>
          </View>
        }
      />

      <CheckoutFooter
        total={finalTotal}
        currency={cartCurrency}
        loading={isLoading}
        onPress={handleCheckout}
        itemCount={itemCount}
        variant="cart"
        withSafeArea={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  title: { ...typography.title },
  itemCount: { ...typography.caption },

  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  footerInfo: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  couponWrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  summaryWrap: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  helper: { ...typography.caption, marginTop: spacing.xs + 2 },
});
