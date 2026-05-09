import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import useOrderStore from "@/store/orderStore";
import { formatPrice } from "@/utils/priceUtils";
import {
  PressableScale,
  Skeleton,
  SuccessAnimation,
  spacing,
  radius,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";

type OrderShape = {
  _id?: string;
  id?: string;
  orderNumber?: string;
  total?: number;
  totalAmount?: number;
  productsCount?: number;
  items?: { quantity: number; name?: string }[];
  productsDetails?: { quantity: number; name?: string; price?: number }[];
  address?: any;
  paymentMethod?: string;
  status?: string;
  estimatedDeliveryAt?: string;
};

export default function OrderSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber } = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();
  const t = useCheckoutTheme();
  const { getOrderById } = useOrderStore();

  const [order, setOrder] = useState<OrderShape | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const fetched = await getOrderById(String(orderId));
      if (!cancelled) {
        setOrder(fetched);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, getOrderById]);

  const items = order?.productsDetails ?? order?.items ?? [];
  const itemsCount =
    items.reduce((sum, it: any) => sum + (Number(it.quantity) || 0), 0) ||
    order?.productsCount ||
    null;

  const totalAmount = order?.total ?? order?.totalAmount;
  const shipsTo =
    typeof order?.address === "string"
      ? order.address
      : [
          order?.address?.name,
          order?.address?.subCityName || order?.address?.area,
          order?.address?.cityName || order?.address?.city,
        ]
          .filter(Boolean)
          .join(", ");

  const eta =
    order?.estimatedDeliveryAt ||
    i18n.t("standardDeliveryEta") ||
    "Estimated 2–4 business days";

  const paymentLabel =
    order?.paymentMethod === "CASH"
      ? i18n.t("cashPayment") || "Cash on delivery"
      : order?.paymentMethod === "BANKAK"
        ? i18n.t("bankakPayment") || "Bank transfer (Bankak)"
        : null;

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xxl + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.duration(220)}
          style={styles.heroWrap}
        >
          <SuccessAnimation size={88} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(280).delay(120)}>
          <Text
            style={[styles.hero, { color: t.textPrimary }]}
          >
            {i18n.t("orderConfirmed") || "Order confirmed"}
          </Text>
          <Text
            style={[styles.subtitle, { color: t.textTertiary }]}
          >
            {i18n.t("orderPlacedMessage") ||
              "Thanks for your purchase. We'll send you tracking updates soon."}
          </Text>
        </Animated.View>

        {/* Order number card */}
        <Animated.View
          entering={FadeInDown.duration(280).delay(180)}
          style={[
            styles.orderCard,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <View style={styles.orderRow}>
            <Text
              style={[styles.orderLabel, { color: t.textTertiary }]}
            >
              {i18n.t("orderNumberLabel") || "Order number"}
            </Text>
            <Text
              style={[styles.orderNumber, { color: t.textPrimary }]}
              numberOfLines={1}
              selectable
            >
              {orderNumber ? `#${orderNumber}` : "—"}
            </Text>
          </View>
          <View
            style={[styles.divider, { backgroundColor: t.divider }]}
          />
          <View style={styles.orderRow}>
            <View style={styles.iconLabel}>
              <Ionicons
                name="time-outline"
                size={14}
                color={t.textTertiary}
              />
              <Text
                style={[styles.orderLabel, { color: t.textTertiary }]}
              >
                {i18n.t("estimatedDelivery") || "Estimated delivery"}
              </Text>
            </View>
            <Text
              style={[styles.orderValue, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {eta}
            </Text>
          </View>
        </Animated.View>

        {/* Details */}
        <Animated.View
          entering={FadeInDown.duration(280).delay(240)}
          style={[
            styles.detailsCard,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Text
            style={[styles.sectionLabel, { color: t.textTertiary }]}
          >
            {i18n.t("orderDetails") || "Order details"}
          </Text>

          {loading ? (
            <View>
              <Skeleton width="60%" height={14} />
              <View style={{ height: 8 }} />
              <Skeleton width="80%" height={14} />
              <View style={{ height: 8 }} />
              <Skeleton width="50%" height={14} />
            </View>
          ) : (
            <>
              {itemsCount != null ? (
                <Row
                  label={i18n.t("orderItemsLabel") || "Items"}
                  value={`${itemsCount} ${
                    itemsCount === 1
                      ? i18n.t("item") || "item"
                      : i18n.t("items") || "items"
                  }`}
                />
              ) : null}

              {paymentLabel ? (
                <Row
                  label={i18n.t("paymentMethod") || "Payment"}
                  value={paymentLabel}
                />
              ) : null}

              {typeof totalAmount === "number" ? (
                <Row
                  label={i18n.t("orderTotalLabel") || "Total paid"}
                  value={formatPrice(totalAmount)}
                  highlight
                />
              ) : null}
            </>
          )}
        </Animated.View>

        {/* Items preview */}
        {!loading && items?.length ? (
          <Animated.View
            entering={FadeInDown.duration(280).delay(280)}
            style={[
              styles.detailsCard,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Text
              style={[styles.sectionLabel, { color: t.textTertiary }]}
            >
              {i18n.t("orderedItems") || "Items in this order"}
            </Text>
            {items.slice(0, 4).map((it: any, idx: number) => (
              <View
                key={`${it?.name ?? "item"}-${idx}`}
                style={styles.itemRow}
              >
                <View
                  style={[
                    styles.itemBullet,
                    { backgroundColor: t.surfaceMuted },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemBulletText,
                      { color: t.textSecondary },
                    ]}
                  >
                    {it.quantity}×
                  </Text>
                </View>
                <Text
                  style={[styles.itemName, { color: t.textPrimary }]}
                  numberOfLines={2}
                >
                  {it.name || i18n.t("product") || "Product"}
                </Text>
                {typeof it?.price === "number" ? (
                  <Text
                    style={[styles.itemPrice, { color: t.textSecondary }]}
                    numberOfLines={1}
                  >
                    {formatPrice(it.price)}
                  </Text>
                ) : null}
              </View>
            ))}
            {items.length > 4 ? (
              <Text
                style={[styles.itemsMore, { color: t.textTertiary }]}
              >
                {`+ ${items.length - 4} ${i18n.t("more") || "more"}`}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}

        {/* Shipping address preview */}
        {shipsTo ? (
          <Animated.View
            entering={FadeInDown.duration(280).delay(320)}
            style={[
              styles.detailsCard,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <View style={styles.shippingHeader}>
              <View
                style={[
                  styles.shippingIcon,
                  { backgroundColor: t.accentSoft },
                ]}
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={t.accent}
                />
              </View>
              <Text
                style={[styles.sectionLabel, { color: t.textTertiary }]}
              >
                {i18n.t("shippingTo") || "Shipping to"}
              </Text>
            </View>
            <Text
              style={[styles.shippingAddress, { color: t.textPrimary }]}
            >
              {shipsTo}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Floating CTA */}
      <Animated.View
        entering={FadeInDown.duration(320).delay(400)}
        style={[
          styles.footer,
          {
            backgroundColor: t.surface,
            borderTopColor: t.divider,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <PressableScale
          onPress={() => {
            if (orderId) {
              router.replace({
                pathname: "/order-tracking" as any,
                params: { orderId: String(orderId) },
              });
            } else {
              router.replace("/order");
            }
          }}
          accessibilityRole="button"
          style={[styles.primaryCta, { backgroundColor: t.textPrimary }]}
        >
          <Ionicons
            name="navigate-outline"
            size={18}
            color={t.surface}
          />
          <Text style={[styles.primaryCtaText, { color: t.surface }]}>
            {i18n.t("trackOrder") || "Track order"}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={() => router.replace("/(tabs)")}
          accessibilityRole="button"
          style={[
            styles.secondaryCta,
            { borderColor: t.border, backgroundColor: t.card },
          ]}
        >
          <Text
            style={[styles.secondaryCtaText, { color: t.textPrimary }]}
          >
            {i18n.t("continueShopping") || "Continue shopping"}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const t = useCheckoutTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: t.textTertiary }]}>
        {label}
      </Text>
      <Text
        style={[
          highlight ? styles.rowHighlight : styles.rowValue,
          { color: t.textPrimary },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  heroWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  hero: {
    ...typography.hero,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  orderCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  orderLabel: { ...typography.caption },
  orderNumber: { ...typography.subtitle },
  orderValue: { ...typography.bodyStrong, flexShrink: 1, textAlign: "right" },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },

  detailsCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  sectionLabel: {
    ...typography.label,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  rowLabel: { ...typography.body },
  rowValue: { ...typography.bodyStrong, textAlign: "right", flexShrink: 1 },
  rowHighlight: {
    ...typography.subtitle,
    textAlign: "right",
    flexShrink: 1,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  itemBullet: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: "center",
  },
  itemBulletText: { ...typography.label },
  itemName: { ...typography.body, flex: 1 },
  itemPrice: { ...typography.captionStrong },
  itemsMore: { ...typography.caption, marginTop: spacing.xs },

  shippingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  shippingIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shippingAddress: { ...typography.body },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.button,
    minHeight: 52,
  },
  primaryCtaText: { ...typography.subtitle },
  secondaryCta: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  secondaryCtaText: { ...typography.bodyStrong },
});
