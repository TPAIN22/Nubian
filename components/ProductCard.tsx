// ProductCard.tsx
import React, { useMemo, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Pressable, FlatList, Image as RNImage, type ViewToken, InteractionManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/providers/ThemeProvider";
import { useIsInWishlist, useWishlistActions } from "@/store/wishlistStore";
import { useAuth } from "@clerk/clerk-expo";
import { navigateToProduct } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { useSetProduct } from "@/store/useItemStore";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { getDisplayPrice } from "@/domain/pricing/pricing.engine";
import { formatPrice, getDiscountPercent } from "@/utils/priceUtils";
import { cleanImages } from "@/utils/productUtils";
import { markTapStart, markNavigationCall } from "@/utils/performance";

export type Product = NormalizedProduct;

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  variant?: "grid" | "horizontal";
  showWishlist?: boolean;
  cardWidth?: number;
}

const ProductCard = React.memo(
  ({ item, onPress, variant = "grid", showWishlist = true, cardWidth: providedCardWidth }: ProductCardProps) => {
    const { theme } = useTheme();
    const colors = theme.colors;

    // Use optimized selectors - only re-render when this specific product's wishlist status changes
    const setProduct = useSetProduct();
    const { addToWishlist, removeFromWishlist } = useWishlistActions();
    const inWishlist = useIsInWishlist(item?.id);
    const { getToken } = useAuth();
    const { trackEvent } = useTracking();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const flatListRef = useRef<FlatList<string>>(null);

    const validImages = useMemo(() => (item ? cleanImages(item.images) : []), [item]);
    const singleImage = validImages.length === 1 ? validImages[0] : null;

    const displayPrice = useMemo(() => (item ? getDisplayPrice(item) : { price: 0, isFrom: false }), [item]);

    const finalPrice = displayPrice.price;
    
    // Original price logic:
    // 1. If we have an explicit discountPrice from backend, that was the intended manual discount
    // 2. If finalPrice < normal price (merchant + nubian markup), show the normal price as original
    // 3. Fallback to finalPrice
    const originalPrice = useMemo(() => {
      if (!item?.productLevelPricing) return finalPrice;
      const { merchantPrice, nubianMarkup, discountPrice, finalPrice: backendFinal } = item.productLevelPricing;
      
      const normalPrice = (merchantPrice || 0) * (1 + (nubianMarkup || 10) / 100);

      // Manual discount override
      if (discountPrice && discountPrice > 0 && Math.abs(finalPrice - discountPrice) < 0.01) {
        return backendFinal || normalPrice || finalPrice;
      }
      
      // Automatic discount (finalPrice is less than normal price)
      if (normalPrice > finalPrice + 0.01) {
        return normalPrice;
      }
      
      return finalPrice;
    }, [item, finalPrice]);

    const productHasDiscount = originalPrice > finalPrice;
    
    const handleClick = useCallback(() => {
      if (!item) return;
      if (onPress) return onPress();

      // PERFORMANCE: Mark tap start for latency measurement
      if (__DEV__) markTapStart(item.id);

      // CRITICAL: Navigate FIRST - this is the user's primary intent
      // Don't block navigation with any synchronous work
      navigateToProduct(item.id, item as any);
      
      if (__DEV__) markNavigationCall(item.id);

      // DEFERRED: Run non-critical work after navigation animation completes
      // This prevents blocking the JS thread during screen transition
      InteractionManager.runAfterInteractions(() => {
        // Track event after navigation is complete
        trackEvent("product_click", { productId: item.id, screen: "product_card" });
        
        // Set product in store (for potential optimistic rendering)
        setProduct(item as any);
        
        // Prefetch images for smoother experience on details screen
        try {
          validImages.slice(0, 2).forEach((uri) => {
            RNImage.prefetch(uri).catch(() => {});
          });
        } catch {}
      });
    }, [onPress, item, setProduct, validImages, trackEvent]);

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

    const measuredWidth = providedCardWidth || containerWidth;
    const canRenderCarousel = measuredWidth > 0 && validImages.length > 1;

    const renderImage = useCallback(
      ({ item: imageUri }: { item: string }) => (
        <View style={{ width: measuredWidth, height: measuredWidth }}>
          <Pressable onPress={handleClick} style={{ width: "100%", height: "100%" }}>
            <Image
              source={{ uri: imageUri }}
              alt="product image"
              style={[styles.productImage, { backgroundColor: colors.surface, width: "100%", height: "100%" }]}
              contentFit="cover"
              transition={300}
            />
          </Pressable>
        </View>
      ),
      [measuredWidth, handleClick, colors.surface]
    );

    const onContainerLayout = useCallback((e: any) => {
      const w = e?.nativeEvent?.layout?.width ?? 0;
      if (w > 0) setContainerWidth(w);
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems?.[0];
      const idx = typeof first?.index === "number" ? first.index : 0;
      setCurrentImageIndex(idx);
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
    const viewabilityConfigCallbackPairs = useRef([{ viewabilityConfig, onViewableItemsChanged }]).current;

    const discountPercentage = useMemo(() => {
      if (!productHasDiscount) return 0;
      if (!originalPrice || !finalPrice) return 0;
      if (originalPrice <= 0) return 0;
      const pct = getDiscountPercent(originalPrice, finalPrice);
      return Math.max(0, Math.min(99, pct));
    }, [productHasDiscount, originalPrice, finalPrice]);

    const renderPagination = () => {
      if (validImages.length <= 1) return null;
      return (
        <View style={styles.pagination}>
          {validImages.map((uri, index) => (
            <View
              key={`${uri}-${index}`}
              style={[
                styles.paginationDot,
                { backgroundColor: colors.overlayLight },
                index === currentImageIndex && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </View>
      );
    };

    if (!item) return null;

    // Horizontal variant
    if (variant === "horizontal") {
      const firstImage = validImages[0];
      return (
        <Card className="p-0" style={[styles.productCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.horizontalContainer}>
            <Pressable onPress={handleClick} style={styles.horizontalImageContainer}>
              <Image
                source={firstImage ? { uri: firstImage } : null}
                alt="product image"
                style={[styles.horizontalImage, { backgroundColor: colors.surface, aspectRatio: 1 }]}
                contentFit="cover"
                transition={300}
              />
            </Pressable>

            <View style={styles.horizontalInfo}>
              <Pressable onPress={handleClick} style={styles.horizontalNameContainer}>
                <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={2}>
                  {item.name}
                </Heading>
              </Pressable>

              <View style={styles.horizontalPriceContainer}>
                {productHasDiscount && (
                  <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>
                    {formatPrice(originalPrice)}
                  </Text>
                )}
                <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
                  {displayPrice.isFrom && (
                    <Text style={{ fontSize: 10, color: colors.text.veryLightGray }}>From </Text>
                  )}
                  {formatPrice(finalPrice)}
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

          {singleImage ? (
            <Pressable onPress={handleClick} style={styles.imagePressable}>
              <Image
                source={{ uri: singleImage }}
                alt="product image"
                style={[styles.productImage, { backgroundColor: colors.surface }]}
                contentFit="cover"
                transition={300}
              />
            </Pressable>
          ) : validImages.length > 1 ? (
            <>
              <View style={[styles.imageContainerWrapper, { overflow: "hidden" }]} onLayout={onContainerLayout}>
                {canRenderCarousel ? (
                  <FlatList
                    ref={flatListRef}
                    data={validImages}
                    renderItem={renderImage}
                    keyExtractor={(uri, index) => `${uri}-${index}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    decelerationRate="fast"
                    snapToInterval={measuredWidth}
                    snapToAlignment="start"
                    viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
                    getItemLayout={(_, index) => ({ length: measuredWidth, offset: measuredWidth * index, index })}
                    style={{ width: measuredWidth, height: measuredWidth }}
                  />
                ) : (
                  <Pressable onPress={handleClick} style={styles.imagePressable}>
                    <Image
                      source={{ uri: validImages[0] as string }}
                      alt="product image"
                      style={[styles.productImage, { backgroundColor: colors.surface }]}
                      contentFit="cover"
                      transition={300}
                    />
                  </Pressable>
                )}
              </View>
              {renderPagination()}
            </>
          ) : (
            <Pressable onPress={handleClick} style={styles.imagePressable}>
              <View style={[styles.productImage, { backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" }]}>
                <Ionicons name="image-outline" size={48} color={colors.text.veryLightGray} />
              </View>
            </Pressable>
          )}

          {discountPercentage > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>{discountPercentage}%</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Pressable onPress={handleClick}>
            <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={2}>
              {item.name}
            </Heading>
          </Pressable>

          <View style={styles.priceContainer}>
            {productHasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]} numberOfLines={1}>
                {formatPrice(originalPrice)}
              </Text>
            )}
            <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
              {displayPrice.isFrom && (
                <Text style={{ fontSize: 10, color: colors.text.veryLightGray }}>From </Text>
              )}
              {formatPrice(finalPrice)}
            </Text>
          </View>
        </View>
      </Card>
    );
  }
);

ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  productCard: { borderRadius: 14, overflow: "hidden", marginBottom: 4 },
  productCardFlex: { flex: 1 },
  imagePressable: { width: "100%", height: "100%" },
  imageContainer: { position: "relative", overflow: "hidden", width: "100%", minHeight: 0 },
  imageContainerWrapper: { width: "100%", aspectRatio: 1, overflow: "hidden" },
  productImage: { width: "100%", height: "100%" },
  wishlistButton: { position: "absolute", top: 10, right: 10, zIndex: 2, borderRadius: 20, width: 36, height: 36, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  discountBadge: { position: "absolute", top: 10, left: 10, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, zIndex: 2 },
  discountText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pagination: { position: "absolute", bottom: 12, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", zIndex: 2 },
  paginationDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
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
