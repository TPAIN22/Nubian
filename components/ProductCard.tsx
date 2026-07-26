// ProductCard.tsx
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, InteractionManager, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/providers/ThemeProvider";
import { useIsInWishlist, useWishlistActions } from "@/store/wishlistStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useAuth } from "@clerk/clerk-expo";
import { navigateToProduct } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import useItemStore from "@/store/useItemStore";
import { usePrefetchProduct, useSetInitialProduct } from "@/store/useProductCacheStore";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { getDisplayPrice } from "@/domain/pricing/pricing.engine";
import { getProductFinalMoney, getProductOriginalMoney, formatMoney } from "@/utils/priceUtils";
import { cleanImages } from "@/utils/productUtils";
import { ikResize } from "@/utils/imageCdn";
import { markTapStart, markNavigationCall } from "@/utils/performance";
import { markTapStartTime } from "@/hooks/useProductFetch";
import { QuickAddButton } from "@/components/cart/QuickAddButton";
import { AppText, DiscountBadge, Price, Rating, Touchable } from "@/components/ui/kit";
import { elevation, iconSize, radius, spacing, pressScale } from "@/theme/tokens";

export type Product = NormalizedProduct;

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  variant?: "grid" | "horizontal";
  showWishlist?: boolean;
  cardWidth?: number;
  /**
   * Renders the one-tap add-to-cart button on the card.
   *
   * Off by default: cards did not have an add affordance before, and turning it
   * on everywhere is a product decision, not a redesign. When enabled it runs
   * the same `useAddToCart` hook as the details CTA and, for products that need
   * a size/colour choice, opens the details screen instead of guessing.
   */
  showQuickAdd?: boolean;
}

/**
 * The product card — the app's most-repeated surface, and therefore the one
 * that sets the perceived quality of the whole catalogue.
 *
 * Visual hierarchy, in the order the eye should land:
 *   1. A large square photo on a neutral well (was ~150px tall and cramped).
 *   2. The discount flag, solid sale-red, top-start.
 *   3. The price — `price` step (17/800) in near-black, not a 14px gold.
 *   4. The product name, two lines, reserved height so a 1-line and a 2-line
 *      card in the same row still align their prices.
 *   5. Rating and category as quiet metadata.
 *
 * The wishlist heart floats top-end in its own elevated white circle so it
 * reads as a control rather than as part of the photo, and it clears 44pt via
 * `hitSlop` without a 44pt circle crowding the image.
 */
const ProductCard = React.memo(
  ({ item, onPress, variant = "grid", showWishlist = true, cardWidth, showQuickAdd = false }: ProductCardProps) => {
    const { theme } = useTheme();
    const colors = theme.colors;
    const { width: windowWidth } = useWindowDimensions();
    // Target render width for CDN resizing: the explicit cardWidth when the
    // parent passes one (home rails), else ~half the screen for the 2-col grid.
    const targetImgWidth = variant === "horizontal" ? 120 : (cardWidth ?? windowWidth / 2);

    // Re-render when currency metadata finishes loading (symbol/decimals become available).
    // Do NOT subscribe to currencyCode here — doing so causes an immediate re-render
    // with the new symbol applied to stale (old-currency) amounts before the re-fetch
    // completes, producing e.g. "SAR 100" when 100 is still a USD price.
    // The data-driven path (item.priceConverted / displayFinalPrice changing after
    // re-fetch) handles the currency switch correctly via the React.memo comparator.
    useCurrencyStore(state => state.currencies.length);
    const formatPrice = useCurrencyStore(state => state.formatPrice);

    // Use optimized selectors - only re-render when this specific product's wishlist status changes
    const setProduct = useItemStore((state: any) => state.setProduct);
    const prefetchProduct = usePrefetchProduct();
    const setInitialProduct = useSetInitialProduct();
    const { addToWishlist, removeFromWishlist } = useWishlistActions();
    const inWishlist = useIsInWishlist(item?.id);
    const { getToken } = useAuth();
    const { trackEvent } = useTracking();

    const validImages = useMemo(() => (item ? cleanImages(item.images) : []), [item]);
    const displayImage = validImages[0] ?? null;

    // --- DEFINITIVE PRICING LOGIC ---
    // Backend convertProductPrices updates root finalPrice/originalPrice (and
    // variant equivalents), but the display* aliases were historically left in
    // USD. ProductSection also runs normalizeProduct, which drops root finalPrice
    // and stashes the converted value under productLevelPricing/simple. So we
    // probe normalized fields first and fall through to the engine — never
    // trusting display* on the primary path, since on a SAR/EGP/etc payload it
    // would render a USD number with the new currency symbol.
    const pricing = useMemo(
      () => (item ? getDisplayPrice(item) : { price: 0, isFrom: false }),
      [item]
    );
    // Prefer the typed Money envelope; fall back to the legacy field chain
    // for payloads that pre-date the envelope migration.
    const finalMoney = getProductFinalMoney(item);
    const originalMoney = getProductOriginalMoney(item);

    const finalPrice = finalMoney?.amount
      ?? (item as any)?.finalPrice
      ?? (item as any)?.productLevelPricing?.finalPrice
      ?? (item as any)?.simple?.finalPrice
      ?? (item as any)?.priceConverted
      ?? pricing.price;

    const originalPrice = originalMoney?.amount
      ?? (item as any)?.originalPrice
      ?? finalPrice;

    // Single rendering helpers: prefer the envelope's pre-formatted string
    // (canonical, currency-aware, decimals-correct) over the local formatter.
    const renderFinal    = () => finalMoney    ? formatMoney(finalMoney)    : formatPrice(finalPrice);
    const renderOriginal = () => originalMoney ? formatMoney(originalMoney) : formatPrice(originalPrice);

    // Percentages are currency-invariant, so either alias is fine.
    const discountPercentage = (item as any)?.discountPercentage
      ?? (item as any)?.displayDiscountPercentage
      ?? 0;

    const productHasDiscount = discountPercentage > 0;

    // Optional metadata — present on some payloads, absent on others. Rendered
    // only when real, never as an empty placeholder row.
    const rating: number = (item as any)?.averageRating ?? (item as any)?.rating ?? 0;
    const metaLabel: string | undefined = (item as any)?.categoryName || undefined;

    // A11y: main press area announces name + price (+ discount when present).
    const a11yLabel = useMemo(() => {
      const priceStr = finalMoney ? formatMoney(finalMoney) : formatPrice(finalPrice);
      const parts = [item?.name, priceStr];
      if (productHasDiscount) parts.push(`${discountPercentage}% off`);
      return parts.filter(Boolean).join(", ");
    }, [item?.name, finalMoney, finalPrice, formatPrice, productHasDiscount, discountPercentage]);

    // PERFORMANCE: Start prefetch on press-in (while user's finger is still down)
    const handlePressIn = useCallback(() => {
      if (!item?.id) return;
      prefetchProduct(item.id);
    }, [item?.id, prefetchProduct]);

    const handleClick = useCallback(() => {
      if (!item) return;
      if (onPress) return onPress();

      // PERFORMANCE: Mark tap start for latency measurement
      if (__DEV__) {
        markTapStart(item.id);
        markTapStartTime(item.id); // For tap-to-content timing
      }

      // CRITICAL: Seed the product cache INSTANTLY with the full list item data
      // This prevents the details screen from showing a loading skeleton or falling back
      // to the minimal URL params initialData, enabling a 0ms perceived load time.
      setInitialProduct(item.id, item as any);

      // CRITICAL: Navigate FIRST - this is the user's primary intent
      // Pass the minimal item representation in URL for deep-link compatibility
      navigateToProduct(item.id, item as any);

      if (__DEV__) markNavigationCall(item.id);

      // DEFERRED: Run non-critical work after navigation animation completes
      InteractionManager.runAfterInteractions(() => {
        trackEvent("product_click", { productId: item.id, screen: "product_card" });
        setProduct(item as any);
      });
    }, [onPress, item, setProduct, trackEvent]);

    const handleWishlistPress = useCallback(async () => {
      if (!item) return;
      const token = await getToken();
      if (!token) return;

      if (inWishlist) {
        removeFromWishlist(item.id, token);
      } else {
        addToWishlist(item as any, token);
        // Defer tracking to not block UI
        InteractionManager.runAfterInteractions(() => {
          trackEvent("wishlist_add", { productId: item.id, screen: "product_card" });
        });
      }
    }, [getToken, inWishlist, item, addToWishlist, removeFromWishlist, trackEvent]);

    if (!item) return null;

    /* ---------------- Horizontal variant (dense list rows) ---------------- */

    if (variant === "horizontal") {
      const firstImage = validImages[0];
      return (
        <Touchable
          onPressIn={handlePressIn}
          onPress={handleClick}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          style={[
            styles.card,
            styles.horizontalCard,
            { backgroundColor: colors.cardBackground },
            elevation.sm,
          ]}
        >
          <View style={[styles.horizontalImageWell, { backgroundColor: colors.imagePlaceholder }]}>
            <Image
              source={firstImage ? { uri: ikResize(firstImage, targetImgWidth) ?? firstImage } : null}
              alt="product image"
              style={styles.fill}
              contentFit="cover"
              transition={260}
              recyclingKey={item.id}
            />
            {productHasDiscount && (
              <DiscountBadge percentage={discountPercentage} style={styles.horizontalDiscount} />
            )}
          </View>

          <View style={styles.horizontalInfo}>
            <AppText variant="cardTitle" tone="title" numberOfLines={2}>
              {item.name}
            </AppText>

            {rating > 0 ? <Rating value={rating} size="sm" /> : null}

            <Price
              value={renderFinal()}
              original={productHasDiscount ? renderOriginal() : null}
              isFrom={pricing.isFrom}
              size="sm"
            />
          </View>
        </Touchable>
      );
    }

    /* ---------------- Grid variant ---------------- */

    return (
      <Touchable
        onPressIn={handlePressIn}
        onPress={handleClick}
        scaleTo={pressScale.card}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={[
          styles.card,
          styles.gridCard,
          { backgroundColor: colors.cardBackground },
          elevation.sm,
        ]}
      >
        <View style={[styles.imageWell, { backgroundColor: colors.imagePlaceholder }]}>
          {displayImage ? (
            <Image
              source={{ uri: ikResize(displayImage, targetImgWidth) ?? displayImage }}
              alt="product image"
              style={styles.fill}
              contentFit="cover"
              // Fades the photo in rather than popping it — the single cheapest
              // thing that stops a grid feeling like a spreadsheet.
              transition={260}
              recyclingKey={item.id}
            />
          ) : (
            <View style={[styles.fill, styles.center]}>
              <Ionicons name="image-outline" size={iconSize.xxl} color={colors.text.subtle} />
            </View>
          )}

          {productHasDiscount && (
            <DiscountBadge percentage={discountPercentage} style={styles.discountSlot} />
          )}

          {showWishlist && (
            <Touchable
              onPress={handleWishlistPress}
              // 4pt of slop on each side takes the visual 36pt circle to the
              // 44pt accessibility target without enlarging it over the photo.
              hitSlop={8}
              scaleTo={pressScale.icon}
              accessibilityRole="button"
              accessibilityState={{ selected: inWishlist }}
              accessibilityLabel={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              style={[
                styles.wishlistButton,
                { backgroundColor: colors.surface },
                elevation.sm,
              ]}
            >
              <Ionicons
                name={inWishlist ? "heart" : "heart-outline"}
                size={iconSize.md}
                color={inWishlist ? colors.sale : colors.text.muted}
              />
            </Touchable>
          )}

          {showQuickAdd && (
            <View style={styles.quickAddSlot}>
              <QuickAddButton product={item} imageUri={displayImage} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <AppText
            variant="cardTitle"
            tone="title"
            numberOfLines={2}
            // Reserved height: keeps prices on one baseline across a row even
            // when one product name wraps and its neighbour doesn't.
            style={styles.name}
          >
            {item.name}
          </AppText>

          {rating > 0 || metaLabel ? (
            <View style={styles.metaRow}>
              {rating > 0 ? <Rating value={rating} size="sm" /> : null}
              {metaLabel ? (
                <AppText variant="micro" tone="subtle" numberOfLines={1} style={styles.metaLabel}>
                  {metaLabel}
                </AppText>
              ) : null}
            </View>
          ) : null}

          <Price
            value={renderFinal()}
            original={productHasDiscount ? renderOriginal() : null}
            isFrom={pricing.isFrom}
            size="md"
            style={styles.price}
          />
        </View>
      </Touchable>
    );
  },
  // PERFORMANCE: Custom comparison to ignore unstable callback references
  // If item.id and visual props are the same, skip re-render
  (prevProps, nextProps) => {
    // Re-render if item identity changes
    if (prevProps.item?.id !== nextProps.item?.id) return false;
    // Re-render if prices change (e.g. after a currency switch triggers re-fetch)
    if ((prevProps.item as any)?.finalPrice !== (nextProps.item as any)?.finalPrice) return false;
    if ((prevProps.item as any)?.originalPrice !== (nextProps.item as any)?.originalPrice) return false;
    if ((prevProps.item as any)?.productLevelPricing?.finalPrice !== (nextProps.item as any)?.productLevelPricing?.finalPrice) return false;
    if ((prevProps.item as any)?.simple?.finalPrice !== (nextProps.item as any)?.simple?.finalPrice) return false;
    if ((prevProps.item as any)?.priceConverted !== (nextProps.item as any)?.priceConverted) return false;
    if ((prevProps.item as any)?.displayFinalPrice !== (nextProps.item as any)?.displayFinalPrice) return false;
    if ((prevProps.item as any)?.displayOriginalPrice !== (nextProps.item as any)?.displayOriginalPrice) return false;
    // Money envelope changes (currency switch landed a new payload)
    if ((prevProps.item as any)?.price?.final?.amount !== (nextProps.item as any)?.price?.final?.amount) return false;
    if ((prevProps.item as any)?.price?.final?.currency !== (nextProps.item as any)?.price?.final?.currency) return false;
    if ((prevProps.item as any)?.price?.original?.amount !== (nextProps.item as any)?.price?.original?.amount) return false;
    // Re-render if visual props change
    if (prevProps.variant !== nextProps.variant) return false;
    if (prevProps.showWishlist !== nextProps.showWishlist) return false;
    if (prevProps.cardWidth !== nextProps.cardWidth) return false;
    if (prevProps.showQuickAdd !== nextProps.showQuickAdd) return false;
    // Don't compare onPress - if item is same, navigation target is same
    return true;
  }
);

ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    // Deliberately NOT `overflow: hidden`. On iOS that sets masksToBounds on
    // the layer, which clips the view's own shadow — the card would render
    // completely flat. Clipping happens on the image well instead, which
    // carries no shadow of its own.
  },
  gridCard: { flex: 1 },
  fill: { width: "100%", height: "100%" },
  center: { alignItems: "center", justifyContent: "center" },

  imageWell: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    // Only the top corners: the well sits flush against the info block below.
    borderTopStartRadius: radius.card,
    borderTopEndRadius: radius.card,
  },

  discountSlot: { position: "absolute", top: spacing.sm, start: spacing.sm, zIndex: 2 },

  wishlistButton: {
    position: "absolute",
    top: spacing.sm,
    end: spacing.sm,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  quickAddSlot: { position: "absolute", bottom: spacing.sm, end: spacing.sm, zIndex: 2 },

  info: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  name: { minHeight: 40 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaLabel: { flex: 1 },
  price: { marginTop: spacing.xxs },

  /* Horizontal */
  horizontalCard: { flexDirection: "row", padding: spacing.md, gap: spacing.md, alignItems: "center" },
  horizontalImageWell: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  horizontalDiscount: { position: "absolute", top: spacing.xs, start: spacing.xs },
  horizontalInfo: { flex: 1, gap: spacing.sm },
});

export default ProductCard;
