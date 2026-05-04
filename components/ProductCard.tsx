// ProductCard.tsx
import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable, InteractionManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
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
import { markTapStart, markNavigationCall } from "@/utils/performance";
import { markTapStartTime } from "@/hooks/useProductFetch";

export type Product = NormalizedProduct;

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  variant?: "grid" | "horizontal";
  showWishlist?: boolean;
  cardWidth?: number;
}

const ProductCard = React.memo(
  ({ item, onPress, variant = "grid", showWishlist = true }: ProductCardProps) => {
    const { theme } = useTheme();
    const colors = theme.colors;

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

    // Horizontal variant
    if (variant === "horizontal") {
      const firstImage = validImages[0];
      return (
        <Card className="p-0" style={[styles.productCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.horizontalContainer}>
            <Pressable onPressIn={handlePressIn} onPress={handleClick} style={styles.horizontalImageContainer}>
              <Image
                source={firstImage ? { uri: firstImage } : null}
                alt="product image"
                style={[styles.horizontalImage, { backgroundColor: colors.surface, aspectRatio: 1 }]}
                contentFit="cover"
                transition={300}
              />
            </Pressable>

            <View style={styles.horizontalInfo}>
              <Pressable onPressIn={handlePressIn} onPress={handleClick} style={styles.horizontalNameContainer}>
                <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={1}>
                  {item.name}
                </Heading>
              </Pressable>

              <View style={styles.horizontalPriceContainer}>
                {productHasDiscount && (
                  <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>
                    {renderOriginal()}
                  </Text>
                )}
                <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
                  {pricing.isFrom && (
                    <Text style={{ fontSize: 10, color: colors.text.veryLightGray }}>From </Text>
                  )}
                  {renderFinal()}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      );
    }

    // Grid variant
    return (
      <Card className="p-0" style={[styles.productCard, styles.productCardFlex, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.imageContainer, { backgroundColor: colors.surface, aspectRatio: 1 }]}>
          {showWishlist && (
            <Pressable
              onPress={handleWishlistPress}
              style={[styles.wishlistButton, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
            >
              <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={20} color={inWishlist ? colors.danger : colors.primary} />
            </Pressable>
          )}

          <Pressable onPressIn={handlePressIn} onPress={handleClick} style={styles.imagePressable}>
            {displayImage ? (
              <Image
                source={{ uri: displayImage }}
                alt="product image"
                style={[styles.productImage, { backgroundColor: colors.surface }]}
                contentFit="cover"
                transition={300}
                recyclingKey={item.id}
              />
            ) : (
              <View style={[styles.productImage, { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="image-outline" size={48} color={colors.text.veryLightGray} />
              </View>
            )}
          </Pressable>

          {discountPercentage > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>{discountPercentage}%</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Pressable onPressIn={handlePressIn} onPress={handleClick}>
            <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={2}>
              {item.name}
            </Heading>
          </Pressable>

          <View style={styles.priceContainer}>
            {productHasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]} numberOfLines={1}>
                {renderOriginal()}
              </Text>
            )}
            <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
              {renderFinal()}
            </Text>
          </View>
        </View>
      </Card>
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
    // Don't compare onPress - if item is same, navigation target is same
    return true;
  }
);

ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  productCard: { borderRadius: 14, overflow: "hidden", marginBottom: 4 },
  productCardFlex: { flex: 1 },
  imagePressable: { width: "100%", height: "100%" },
  imageContainer: { position: "relative", overflow: "hidden", width: "100%", minHeight: 0 },
  productImage: { width: "100%", height: "100%" },
  wishlistButton: { position: "absolute", top: 10, right: 10, zIndex: 2, borderRadius: 20, width: 36, height: 36, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  discountBadge: { position: "absolute", top: 10, left: 10, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, zIndex: 2 },
  discountText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  productInfo: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, minHeight: 60 },
  productName: { fontSize: 12, fontWeight: "600", lineHeight: 18, marginBottom: 6, minHeight: 36 },
  priceContainer: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 2, minHeight: 20 },
  originalPrice: { textDecorationLine: "line-through", fontSize: 11, fontWeight: "400" },
  currentPrice: { fontWeight: "700", fontSize: 14, flexShrink: 0 },

  horizontalContainer: { flexDirection: "row", padding: 12 },
  horizontalImageContainer: { marginRight: 12 },
  horizontalImage: { width: 100, borderRadius: 8 },
  horizontalInfo: { flex: 1, justifyContent: "space-between" },
  horizontalNameContainer: { marginBottom: 8 },
  horizontalPriceContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
});

export default ProductCard;
