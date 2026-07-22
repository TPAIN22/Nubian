import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import { useRTL } from "@/hooks/useRTL";
import useOrderStore from "@/store/orderStore";
import { navigateToProduct } from "@/utils/deepLinks";
import { normalizeProduct } from "@/domain/product/product.normalize";
import {
  getFinalPrice,
  getOriginalPrice,
  hasDiscount,
} from "@/utils/priceUtils";
import {
  PressableScale,
  Skeleton,
  spacing,
  radius,
  typography,
  useCheckoutTheme,
  withAlpha,
  type CheckoutPalette,
} from "@/components/checkout";

// ─── Status helpers ─────────────────────────────────────────────────────────

type StatusKey =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
type Filter = "all" | StatusKey;

const FILTERS: Filter[] = [
  "all",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function statusToKey(raw?: string): StatusKey {
  switch ((raw || "").toLowerCase()) {
    case "paid":
    case "placed":
    case "processing":
    case "confirmed":
      return "confirmed";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
    case "rejected":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

function statusColors(t: CheckoutPalette, key: StatusKey) {
  switch (key) {
    case "pending":
      return { bg: t.warningSoft, fg: t.warning };
    case "confirmed":
      return { bg: t.accentSoft, fg: t.accent };
    case "shipped":
      return { bg: withAlpha("#3b82f6", 0.12), fg: "#2563eb" };
    case "delivered":
      return { bg: t.successSoft, fg: t.success };
    case "cancelled":
      return { bg: t.errorSoft, fg: t.error };
  }
}

function statusLabel(key: StatusKey) {
  const map: Record<StatusKey, string> = {
    pending: i18n.t("orderStatusPending") || "Pending",
    confirmed: i18n.t("orderStatusConfirmed") || "Confirmed",
    shipped: i18n.t("orderStatusShipped") || "Shipped",
    delivered: i18n.t("orderStatusDelivered") || "Delivered",
    cancelled: i18n.t("orderStatusCancelled") || "Cancelled",
  };
  return map[key];
}

function statusIcon(key: StatusKey): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case "pending":
      return "time-outline";
    case "confirmed":
      return "checkmark-circle-outline";
    case "shipped":
      return "airplane-outline";
    case "delivered":
      return "checkmark-done-circle-outline";
    case "cancelled":
      return "close-circle-outline";
  }
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatCurrency(amount: number, code?: string) {
  const safe =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  const currency = code || i18n.t("currency") || "USD";
  return `${safe.toLocaleString()} ${currency}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderDisplay(order: any) {
  const code = order?.currencyCodeSelected || i18n.t("currency") || "USD";
  const final =
    order?.finalAmountConverted ??
    order?.finalAmount ??
    order?.totalAmount ??
    0;
  const subtotal = order?.totalAmountConverted ?? order?.totalAmount ?? 0;
  const discount = order?.discountAmountConverted ?? order?.discountAmount ?? 0;
  return { code, final, subtotal, discount };
}

function productsCount(products: any[]): number {
  if (!Array.isArray(products)) return 0;
  return products.reduce((acc, p) => acc + (Number(p?.quantity) || 1), 0);
}

function paymentMethodText(method?: string) {
  switch ((method || "").toLowerCase()) {
    case "cash":
      return i18n.t("paymentMethodCash") || "Cash";
    case "card":
      return i18n.t("paymentMethodCard") || "Card";
    case "bank":
    case "bankak":
      return i18n.t("paymentMethodBank") || "Bank transfer";
    default:
      return method || "—";
  }
}

function paymentStatusText(s?: string) {
  switch ((s || "").toLowerCase()) {
    case "paid":
      return i18n.t("paymentStatusPaid") || "Paid";
    case "failed":
      return i18n.t("paymentStatusFailed") || "Failed";
    case "pending":
      return i18n.t("paymentStatusPending") || "Pending";
    default:
      return s || "—";
  }
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function Order() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useCheckoutTheme();
  const rtl = useRTL();

  const { getUserOrders, orders, error, isLoading } = useOrderStore();
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getUserOrders().catch(() => {});
  }, [getUserOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserOrders().catch(() => {});
    setRefreshing(false);
  };

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o: any) => statusToKey(o.status) === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders as any[]) {
      c[statusToKey(o.status)]++;
    }
    return c;
  }, [orders]);

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("back") || "Back"}
        style={[
          styles.iconBtn,
          { backgroundColor: t.card, borderColor: t.border },
        ]}
      >
        <Ionicons name={rtl.chevronBack} size={20} color={t.textPrimary} />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
          {i18n.t("myOrders") || "My orders"}
        </Text>
        {orders.length > 0 ? (
          <Text style={[styles.headerSubtitle, { color: t.textTertiary }]}>
            {orders.length}{" "}
            {orders.length === 1
              ? i18n.t("orderUnitOne") || "order"
              : i18n.t("orderUnitMany") || "orders"}
          </Text>
        ) : null}
      </View>

      <View style={{ width: 36 }} />
    </View>
  );

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading && orders.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: t.surface }]}>
        {Header}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.card,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <Skeleton width="55%" height={18} />
              <View style={{ height: spacing.sm }} />
              <Skeleton width="35%" height={12} />
              <View style={{ height: spacing.md }} />
              <Skeleton width="100%" height={60} />
              <View style={{ height: spacing.md }} />
              <Skeleton width="40%" height={20} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error && orders.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: t.surface }]}>
        {Header}
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title={i18n.t("errorOccurred") || "Something went wrong"}
          subtitle={error}
          ctaLabel={i18n.t("tryAgain") || "Try again"}
          onCta={onRefresh}
          t={t}
        />
      </View>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!isLoading && orders.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: t.surface }]}>
        {Header}
        <EmptyState
          icon="bag-handle-outline"
          tone="accent"
          title={i18n.t("noOrders") || "No orders yet"}
          subtitle={
            i18n.t("noOrdersHint") ||
            "Your orders will appear here once you place one."
          }
          ctaLabel={i18n.t("startShopping") || "Start shopping"}
          onCta={() => router.replace("/(tabs)")}
          t={t}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      {Header}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
        >
          {FILTERS.map((key) => {
            const active = filter === key;
            const label =
              key === "all"
                ? i18n.t("all") || "All"
                : statusLabel(key);
            const count = counts[key];
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? t.textPrimary : t.card,
                    borderColor: active ? t.textPrimary : t.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? t.surface : t.textSecondary },
                  ]}
                >
                  {label}
                  {count > 0 ? ` · ${count}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={t.accent}
            colors={[t.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={[
              styles.card,
              {
                backgroundColor: t.card,
                borderColor: t.border,
                alignItems: "center",
                paddingVertical: spacing.xxl,
              },
            ]}
          >
            <Ionicons name="filter-outline" size={28} color={t.textTertiary} />
            <Text
              style={[
                styles.emptyTitle,
                { color: t.textPrimary, marginTop: spacing.sm },
              ]}
            >
              {i18n.t("noOrdersForFilter") ||
                "No orders match this filter"}
            </Text>
          </Animated.View>
        ) : (
          filtered.map((order: any, idx: number) => (
            <OrderCard
              key={order._id}
              order={order}
              expanded={!!expanded[order._id]}
              onToggle={() => toggle(order._id)}
              onTrack={() =>
                router.push(`/order-tracking/${order._id}` as any)
              }
              index={idx}
              t={t}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── OrderCard ──────────────────────────────────────────────────────────────

type OrderCardProps = {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onTrack: () => void;
  index: number;
  t: CheckoutPalette;
};

function OrderCard({
  order,
  expanded,
  onToggle,
  onTrack,
  index,
  t,
}: OrderCardProps) {
  const statusKey = statusToKey(order.status);
  const sc = statusColors(t, statusKey);
  const display = orderDisplay(order);
  const products: any[] = order.productsDetails || [];
  const itemCount = productsCount(products);

  // First 4 thumbnails for the preview strip
  const thumbs: string[] = products
    .map((p) => (Array.isArray(p?.images) ? p.images[0] : undefined))
    .filter((u): u is string => typeof u === "string" && u.length > 0)
    .slice(0, 4);
  const moreCount = Math.max(0, products.length - thumbs.length);

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(Math.min(index, 6) * 40)}
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      {/* Top row: order # + status pill */}
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[typography.label, styles.cardEyebrow, { color: t.textTertiary }]}
          >
            {i18n.t("orderNumberLabel") || "Order"}
          </Text>
          <Text
            style={[styles.orderNumber, { color: t.textPrimary }]}
            numberOfLines={1}
          >
            #{order.orderNumber || (order._id || "").slice(-6)}
          </Text>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: sc.bg },
          ]}
        >
          <Ionicons name={statusIcon(statusKey)} size={12} color={sc.fg} />
          <Text style={[styles.statusText, { color: sc.fg }]}>
            {statusLabel(statusKey)}
          </Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={t.textTertiary} />
          <Text style={[styles.metaText, { color: t.textTertiary }]}>
            {formatDate(order.orderDate || order.createdAt)}
          </Text>
        </View>
        <View style={[styles.metaDot, { backgroundColor: t.textTertiary }]} />
        <View style={styles.metaItem}>
          <Ionicons name="cube-outline" size={12} color={t.textTertiary} />
          <Text style={[styles.metaText, { color: t.textTertiary }]}>
            {itemCount}{" "}
            {itemCount === 1
              ? i18n.t("item") || "item"
              : i18n.t("items") || "items"}
          </Text>
        </View>
      </View>

      {/* Item thumbnail strip */}
      {thumbs.length > 0 ? (
        <View style={styles.thumbStrip}>
          {thumbs.map((uri, i) => (
            <View
              key={`${uri}-${i}`}
              style={[
                styles.thumbWrap,
                {
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: thumbs.length - i,
                },
              ]}
            >
              <Image
                source={{ uri }}
                style={styles.thumbImg}
                contentFit="cover"
                transition={150}
              />
            </View>
          ))}
          {moreCount > 0 ? (
            <View
              style={[
                styles.thumbWrap,
                styles.thumbMore,
                {
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  marginLeft: -10,
                },
              ]}
            >
              <Text style={[styles.thumbMoreText, { color: t.textSecondary }]}>
                +{moreCount}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Coupon (if any) */}
      {order?.couponDetails?.code ? (
        <View
          style={[
            styles.couponBanner,
            { backgroundColor: t.accentSoft },
          ]}
        >
          <Ionicons name="pricetag-outline" size={14} color={t.accent} />
          <Text style={[styles.couponText, { color: t.accent }]}>
            {order.couponDetails.code}
          </Text>
          {display.discount > 0 ? (
            <Text style={[styles.couponSave, { color: t.accent }]}>
              −{formatCurrency(display.discount, display.code)}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Total */}
      <View
        style={[styles.totalRow, { borderTopColor: t.divider }]}
      >
        <View>
          <Text
            style={[typography.label, { color: t.textTertiary }]}
          >
            {i18n.t("orderTotalLabel") || "Total"}
          </Text>
          {display.discount > 0 ? (
            <Text style={[styles.totalStruck, { color: t.textTertiary }]}>
              {formatCurrency(display.subtotal, display.code)}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.totalAmount, { color: t.textPrimary }]}>
          {formatCurrency(display.final, display.code)}
        </Text>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <PressableScale
          onPress={onTrack}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("trackOrder") || "Track order"}
          style={[
            styles.actionBtn,
            styles.actionPrimary,
            { backgroundColor: t.textPrimary },
          ]}
        >
          <Ionicons name="navigate-outline" size={16} color={t.surface} />
          <Text style={[styles.actionPrimaryText, { color: t.surface }]}>
            {i18n.t("trackOrder") || "Track order"}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? i18n.t("hideDetails") || "Hide details"
              : i18n.t("showDetails") || "View details"
          }
          accessibilityState={{ expanded }}
          style={[
            styles.actionBtn,
            styles.actionSecondary,
            { borderColor: t.border, backgroundColor: t.card },
          ]}
        >
          <Text
            style={[styles.actionSecondaryText, { color: t.textPrimary }]}
          >
            {expanded
              ? i18n.t("hideDetails") || "Hide details"
              : i18n.t("showDetails") || "View details"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={t.textPrimary}
          />
        </PressableScale>
      </View>

      {/* Expanded section */}
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          style={[styles.expanded, { borderTopColor: t.divider }]}
        >
          <ExpandedDetails order={order} t={t} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

// ─── ExpandedDetails ────────────────────────────────────────────────────────

function ExpandedDetails({
  order,
  t,
}: {
  order: any;
  t: CheckoutPalette;
}) {
  const display = orderDisplay(order);
  const products: any[] = order.productsDetails || [];

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Delivery */}
      <Section
        title={i18n.t("deliveryInfo") || "Delivery information"}
        t={t}
      >
        <DetailRow
          label={i18n.t("city") || "City"}
          value={order.city || "—"}
          t={t}
        />
        <DetailRow
          label={i18n.t("address") || "Address"}
          value={
            typeof order.address === "string"
              ? order.address
              : [
                  order?.address?.name,
                  order?.address?.subCityName || order?.address?.area,
                  order?.address?.cityName || order?.address?.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"
          }
          t={t}
        />
        <DetailRow
          label={i18n.t("phoneNumber") || "Phone"}
          value={order.phoneNumber || "—"}
          t={t}
        />
        <DetailRow
          label={i18n.t("paymentMethod") || "Payment method"}
          value={paymentMethodText(order.paymentMethod)}
          t={t}
        />
        <DetailRow
          label={i18n.t("paymentStatus") || "Payment status"}
          value={paymentStatusText(order.paymentStatus)}
          valueColor={
            (order.paymentStatus || "").toLowerCase() === "paid"
              ? t.success
              : (order.paymentStatus || "").toLowerCase() === "failed"
                ? t.error
                : t.warning
          }
          t={t}
        />
      </Section>

      {/* Items */}
      <Section
        title={`${i18n.t("orderedItems") || "Items in this order"} (${productsCount(
          products,
        )})`}
        t={t}
      >
        {products.length === 0 ? (
          <Text style={[typography.body, { color: t.textTertiary }]}>
            {i18n.t("noProductsDetails") || "No item details available"}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {products.map((p: any, idx: number) => (
              <ProductRow
                key={p?._id || idx}
                product={p}
                fallbackCode={display.code}
                t={t}
              />
            ))}
          </View>
        )}
      </Section>

      {/* Last updated */}
      {order.updatedAt ? (
        <Text
          style={[
            typography.caption,
            { color: t.textTertiary, textAlign: "center" },
          ]}
        >
          {i18n.t("lastUpdated") || "Last updated"}: {formatDateTime(order.updatedAt)}
        </Text>
      ) : null}
    </View>
  );
}

function Section({
  title,
  t,
  children,
}: {
  title: string;
  t: CheckoutPalette;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={[
          typography.label,
          {
            color: t.textTertiary,
            textTransform: "uppercase",
          },
        ]}
      >
        {title}
      </Text>
      <View style={{ gap: spacing.xs + 2 }}>{children}</View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
  t,
}: {
  label: string;
  value: string;
  valueColor?: string;
  t: CheckoutPalette;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.body, { color: t.textTertiary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.bodyStrong,
          { color: valueColor || t.textPrimary, flexShrink: 1, textAlign: "right" },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── ProductRow ─────────────────────────────────────────────────────────────

function ProductRow({
  product,
  fallbackCode,
  t,
}: {
  product: any;
  fallbackCode: string;
  t: CheckoutPalette;
}) {
  const id = product?.productId || product?._id;
  const onPress = () => {
    if (!id) return;
    navigateToProduct(
      id,
      {
        _id: id,
        name: product.name || product.productName,
        price: product.price || 0,
        discountPrice: product.discountPrice,
        images: product.images || [],
      } as any,
      { variantId: product?.variantId || null }
    );
  };

  // Pricing: prefer pre-computed display fields; fall back to normalized product.
  let finalPrice: number =
    product.displayFinalPrice ?? product.price ?? 0;
  let originalPrice: number =
    product.displayOriginalPrice ?? product.originalPrice ?? 0;
  let productHasDiscount = (product.displayDiscountPercentage ?? 0) > 0;

  if (
    product.displayFinalPrice === undefined &&
    product.displayOriginalPrice === undefined
  ) {
    const normalized = normalizeProduct({
      _id: id || "",
      name: product.name || "",
      merchantPrice: product.merchantPrice || product.price || 0,
      finalPrice: product.price || 0,
      images: product.images || [],
      variants: [],
    } as any);
    finalPrice = getFinalPrice(normalized);
    originalPrice = getOriginalPrice(normalized);
    productHasDiscount = hasDiscount(normalized);
  }

  const qty = Number(product.quantity) || 1;
  const lineTotal = finalPrice * qty;
  const code = product.currencyCode || fallbackCode;
  const img = Array.isArray(product.images) ? product.images[0] : undefined;
  const productName =
    product.name || product.productName || i18n.t("product") || "Product";

  return (
    <Pressable
      onPress={onPress}
      disabled={!id}
      accessibilityRole="button"
      accessibilityLabel={`${productName}, ${formatCurrency(lineTotal, code)}`}
      style={[
        styles.productRow,
        { backgroundColor: t.surfaceMuted, borderColor: t.border },
      ]}
    >
      <View
        style={[
          styles.productImgWrap,
          { borderColor: t.border, backgroundColor: t.card },
        ]}
      >
        {img ? (
          <Image
            source={{ uri: img }}
            style={styles.productImg}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Ionicons name="image-outline" size={20} color={t.textTertiary} />
        )}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text
          style={[typography.bodyStrong, { color: t.textPrimary }]}
          numberOfLines={2}
        >
          {productName}
        </Text>
        <View style={styles.productPriceRow}>
          {productHasDiscount ? (
            <Text style={[typography.caption, { color: t.textTertiary }]}>
              <Text style={{ textDecorationLine: "line-through" }}>
                {formatCurrency(originalPrice, code)}
              </Text>{" "}
              · {formatCurrency(finalPrice, code)} × {qty}
            </Text>
          ) : (
            <Text style={[typography.caption, { color: t.textTertiary }]}>
              {formatCurrency(finalPrice, code)} × {qty}
            </Text>
          )}
        </View>
      </View>
      <Text style={[typography.bodyStrong, { color: t.textPrimary }]}>
        {formatCurrency(lineTotal, code)}
      </Text>
    </Pressable>
  );
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
  tone,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  tone: "accent" | "error";
  t: CheckoutPalette;
}) {
  const ringBg = tone === "error" ? t.errorSoft : t.accentSoft;
  const ringFg = tone === "error" ? t.error : t.accent;
  return (
    <View style={styles.emptyWrap}>
      <Animated.View entering={FadeIn.duration(220)} style={{ alignItems: "center", gap: spacing.md }}>
        <View style={[styles.emptyIconRing, { backgroundColor: ringBg }]}>
          <Ionicons name={icon} size={32} color={ringFg} />
        </View>
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              typography.body,
              {
                color: t.textTertiary,
                textAlign: "center",
                paddingHorizontal: spacing.lg,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        {ctaLabel && onCta ? (
          <PressableScale
            onPress={onCta}
            accessibilityRole="button"
            style={[
              styles.emptyCta,
              { backgroundColor: t.textPrimary },
            ]}
          >
            <Text style={[typography.subtitle, { color: t.surface }]}>
              {ctaLabel}
            </Text>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    ...typography.title,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },

  filterRow: {
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 34,
    justifyContent: "center",
  },
  chipText: {
    ...typography.captionStrong,
  },

  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardEyebrow: {
    textTransform: "uppercase",
  },
  orderNumber: {
    ...typography.subtitle,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusText: {
    ...typography.label,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    ...typography.caption,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },

  thumbStrip: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  thumbMore: {
    width: 44,
    height: 44,
  },
  thumbMoreText: {
    ...typography.captionStrong,
  },

  couponBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  couponText: {
    ...typography.captionStrong,
    flex: 1,
  },
  couponSave: {
    ...typography.captionStrong,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalStruck: {
    ...typography.caption,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  totalAmount: {
    ...typography.totalAmount,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    minHeight: 46,
  },
  actionPrimary: {},
  actionPrimaryText: {
    ...typography.bodyStrong,
  },
  actionSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionSecondaryText: {
    ...typography.bodyStrong,
  },

  expanded: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.sm + 2,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
  },
  productImgWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  productImg: {
    width: "100%",
    height: "100%",
  },
  productPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...typography.subtitle,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
