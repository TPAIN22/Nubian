import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { GestureHandlerRootView, GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from "react-native-reanimated";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  InteractionManager,
  Image as RNImage,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProductFetch } from "@/hooks/useProductFetch";
import { useIsInWishlist, useWishlistActions } from "@/store/wishlistStore";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { markScreenMount } from "@/utils/performance";
import { logPerf } from "@/hooks/useProductFetch";

import type { SelectedAttributes } from "@/domain/product/product.selectors";
import { getAttributeOptions, normalizeSelectedAttributes } from "@/domain/product/product.selectors";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { matchVariant, pickDisplayVariant } from "@/domain/variant/variant.match";
import { isVariantSelectable } from "@/domain/product/product.guards";
import { resolvePrice } from "@/domain/pricing/pricing.engine";
import { formatPrice } from "@/utils/priceUtils";

import { useRecommendationStore } from "@/store/useRecommendationStore";
import { useTracking } from "@/hooks/useTracking";
import {
  COLORS,
  PRODUCT_DETAILS_CONFIG,
} from "@/constants/productDetails";

import { ProductHeader } from "@/components/ProductDetails/ProductHeader";
import { ProductImageCarousel } from "@/components/ProductDetails/ProductImageCarousel";
import { ProductAttributes } from "@/components/ProductDetails/ProductAttributes";
import Review from "@/components/Review";
import { ProductRecommendations } from "@/components/ProductDetails/ProductRecommendations";
import { ProductActions } from "@/components/ProductDetails/ProductActions";

// Zoomable Image component for fullscreen modal
const ZoomableImage = ({ uri }: { uri: string }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.modalImageContainer, animatedStyle]}>
        <Image
          source={{ uri }}
          style={styles.modalImage}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

// Skeleton component for loading/error states
const ProductDetailsSkeleton = ({ colors }: { colors: any }) => {
  const skeletonColor = colors.borderLight + '40';
  const shimmerValue = useSharedValue(0.3);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerValue.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header Skeleton */}
      <View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor }} />
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Main Image Carousel Skeleton */}
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: skeletonColor }}>
          <Animated.View style={[animatedStyle, { flex: 1, backgroundColor: colors.borderLight + '60' }]} />
          {/* Carousel Dots */}
          <View style={{ position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity: 0.5 }} />
            ))}
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Category & Title */}
          <Animated.View style={[animatedStyle, { width: 100, height: 14, borderRadius: 4, backgroundColor: colors.primary + '30', marginBottom: 8 }]} />
          <Animated.View style={[animatedStyle, { width: '85%', height: 28, borderRadius: 6, backgroundColor: skeletonColor, marginBottom: 15 }]} />

          {/* Pricing & Discount */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 }}>
            <Animated.View style={[animatedStyle, { width: 120, height: 35, borderRadius: 8, backgroundColor: colors.primary + '20' }]} />
            <Animated.View style={[animatedStyle, { width: 60, height: 20, borderRadius: 4, backgroundColor: skeletonColor }]} />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.borderLight + '50', marginBottom: 25 }} />

          {/* Attribute Section 1 (e.g. Size) */}
          <Animated.View style={[animatedStyle, { width: 80, height: 18, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
            {[1, 2, 3, 4].map(i => (
              <Animated.View key={i} style={[animatedStyle, { width: 60, height: 45, borderRadius: 12, backgroundColor: skeletonColor }]} />
            ))}
          </View>

          {/* Attribute Section 2 (e.g. Color) */}
          <Animated.View style={[animatedStyle, { width: 80, height: 18, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
            {[1, 2, 3].map(i => (
              <Animated.View key={i} style={[animatedStyle, { width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor, borderWidth: 1, borderColor: colors.borderLight }]} />
            ))}
          </View>

          {/* Stock & SKU Info */}
          <View style={{ marginBottom: 30 }}>
            <Animated.View style={[animatedStyle, { width: 140, height: 16, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 8 }]} />
            <Animated.View style={[animatedStyle, { width: 100, height: 14, borderRadius: 4, backgroundColor: skeletonColor }]} />
          </View>

          {/* Description Section */}
          <Animated.View style={[animatedStyle, { width: 120, height: 20, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          {[1, 2, 3, 4].map(i => (
            <Animated.View key={i} style={[animatedStyle, { width: i === 4 ? '60%' : '100%', height: 14, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 8 }]} />
          ))}

          {/* Reviews Section Placeholder */}
          <View style={{ marginTop: 40, paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.borderLight + '50' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Animated.View style={[animatedStyle, { width: 100, height: 22, borderRadius: 4, backgroundColor: skeletonColor }]} />
              <Animated.View style={[animatedStyle, { width: 60, height: 18, borderRadius: 4, backgroundColor: skeletonColor }]} />
            </View>
            <View style={{ backgroundColor: skeletonColor, height: 100, borderRadius: 15, width: '100%' }} />
          </View>

          {/* Recommendations Grid Placeholder */}
          <View style={{ marginTop: 20 }}>
            <Animated.View style={[animatedStyle, { width: 180, height: 22, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 20 }]} />
            <View style={{ flexDirection: 'row', gap: 15 }}>
              {[1, 2].map(i => (
                <View key={i} style={{ flex: 1 }}>
                  <Animated.View style={[animatedStyle, { aspectRatio: 0.8, borderRadius: 15, backgroundColor: skeletonColor, marginBottom: 10 }]} />
                  <Animated.View style={[animatedStyle, { width: '80%', height: 14, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 6 }]} />
                  <Animated.View style={[animatedStyle, { width: '50%', height: 14, borderRadius: 4, backgroundColor: colors.primary + '20' }]} />
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Floating Bar Skeleton */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 16,
        paddingBottom: 32,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        flexDirection: 'row',
        gap: 12
      }}>
        <View style={{ width: 55, height: 55, borderRadius: 15, backgroundColor: skeletonColor }} />
        <View style={{ flex: 1, height: 55, borderRadius: 15, backgroundColor: colors.primary + '40' }} />
      </View>
    </View>
  );
};

export default function Details() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.details ? String(params.details) : "";

  // Extract initial data from route params for instant render
  const initialData = useMemo(() => {
    if (!productId) return undefined;
    const name = params.name ? String(params.name) : undefined;
    const priceStr = params.price ? String(params.price) : undefined;
    const image = params.image ? String(params.image) : undefined;

    if (!name && !priceStr && !image) return undefined;

    return {
      id: productId,
      name,
      images: image ? [image] : [],
      price: priceStr ? Number(priceStr) : undefined,
    };
  }, [productId, params.name, params.price, params.image]);

  // PERFORMANCE: Mark screen mount immediately
  useLayoutEffect(() => {
    if (productId && __DEV__) {
      markScreenMount(productId);
    }
  }, [productId]);

  // Use cached hook with initial data for instant render
  const { product, isLoading, error } = useProductFetch(productId, initialData);

  // Use optimized wishlist selectors
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { trackEvent } = useTracking();

  const [selectedAttributes, setSelectedAttributes] =
    useState<SelectedAttributes>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const lastTrackedRef = useRef<string | null>(null);

  // recommendations
  const {
    productRecommendations,
    isProductRecommendationsLoading,
    fetchProductRecommendations,
  } = useRecommendationStore();
  const recommendations = productRecommendations[productId];
  const isLoadingRecommendations = isProductRecommendationsLoading[productId];

  // PERFORMANCE: Defer recommendations fetch until navigation animation completes
  useEffect(() => {
    if (!productId || !showDeferred) return;
    const task = InteractionManager.runAfterInteractions(() => {
      fetchProductRecommendations(productId);
    });
    return () => task.cancel();
  }, [productId, fetchProductRecommendations, showDeferred]);

  // PERFORMANCE: Defer analytics tracking until AFTER first paint (non-blocking)
  useEffect(() => {
    const id = (product as any)?.id;
    if (!id || !showDeferred) return;
    if (lastTrackedRef.current === id) return;
    lastTrackedRef.current = id;
    // Fire-and-forget - don't await, wrapping ensures no blocking
    Promise.resolve().then(() => {
      trackEvent("product_view", { productId: id, screen: "product_details" });
    });
  }, [(product as any)?.id, trackEvent, showDeferred]);

  const viewProduct = product as NormalizedProduct | null;

  // PERFORMANCE: Use requestAnimationFrame for fastest possible deferred render
  useEffect(() => {
    let cancelled = false;
    // Wait for first paint, then enable heavy sections
    requestAnimationFrame(() => {
      if (!cancelled) {
        setShowDeferred(true);
        logPerf(productId, 'HEAVY_SECTIONS_START');
      }
    });
    return () => { cancelled = true; };
  }, [productId]);

  const optionsMap = useMemo(() => (viewProduct ? getAttributeOptions(viewProduct) : {}), [viewProduct]);

  const productAttributes = useMemo(() => {
    if (!viewProduct) return [];
    if (viewProduct.attributeDefs && viewProduct.attributeDefs.length > 0) {
      return viewProduct.attributeDefs;
    }
    return Object.keys(optionsMap).map(key => ({
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      required: true
    }));
  }, [viewProduct, optionsMap]);

  const normalizedSelection = useMemo(
    () => normalizeSelectedAttributes(selectedAttributes),
    [selectedAttributes]
  );

  /** ✅ auto-init required attributes when options exist (regardless of type) */
  useEffect(() => {
    if (!productAttributes.length) return;

    setSelectedAttributes((prev: SelectedAttributes) => {
      const next: SelectedAttributes = { ...prev };
      let changed = false;

      for (const attr of productAttributes) {
        const key = String(attr.name ?? "")
          .trim()
          .toLowerCase();

        const options = optionsMap[key] || [];

        // deterministic auto-select ONLY if backend provides exactly one option
        if (attr.required && options.length === 1) {
          if (!(next as any)[key]) {
            (next as any)[key] = options[0]!;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [productAttributes, optionsMap]);

  const matchingVariant = useMemo(
    () => (viewProduct ? matchVariant(viewProduct, normalizedSelection) : null),
    [viewProduct, normalizedSelection]
  );

  const displayVariant = useMemo(
    () => {
      if (!viewProduct) return null;
      // 1. Precise, selectable match (e.g. for cart)
      if (matchingVariant) return matchingVariant;

      // 2. Lenient match for display (ignore stock, just check attributes)
      // This ensures if user selects "Red", we show Red images even if that specific variant is OOS or partial
      const selKeys = Object.keys(normalizedSelection);
      if (selKeys.length > 0) {
        const variants = Array.isArray(viewProduct.variants) ? viewProduct.variants : [];
        for (const v of variants) {
          if (v.isActive === false) continue; // Skip inactive

          const attrs = v.attributes || {};
          let ok = true;
          for (const k of selKeys) {
            // loose matching for string values
            if (!attrs[k] || String(attrs[k]) !== String(normalizedSelection[k])) {
              ok = false;
              break;
            }
          }
          if (ok) return v as any;
        }
      }

      // 3. Fallback
      const picked = pickDisplayVariant(viewProduct);
      return picked || null;
    },
    [viewProduct, matchingVariant, normalizedSelection]
  );

  const productImages = useMemo(() => {
    if (!viewProduct) return [];

    // 1. Get images for the currently selected/displayed variant
    const variantImages =
      displayVariant?.images && displayVariant.images.length > 0
        ? displayVariant.images
        : [];

    // 2. Get generic product images (always shown)
    const mainImages = viewProduct.images || [];

    // 3. Fallback: If variant has images, use ONLY them to avoid Showing wrong-color general images.
    // Otherwise, fallback to main product images.
    const images = variantImages.length > 0 ? variantImages : mainImages;

    // 4. De-duplicate and filter valid strings
    const uniqueImages = Array.from(new Set(images)).filter((img): img is string => !!img && typeof img === "string");

    return uniqueImages.length > 0 ? uniqueImages : [];
  }, [viewProduct, displayVariant?.images]);

  // PERFORMANCE: Defer image prefetching until navigation animation completes
  useEffect(() => {
    if (!productImages?.length) return;

    const task = InteractionManager.runAfterInteractions(() => {
      const first = productImages[0];
      if (first) RNImage.prefetch(first).catch(() => { });

      // Prefetch remaining images with a small delay
      setTimeout(() => {
        try {
          const rest = productImages.slice(
            PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
            PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX +
            PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
          );
          rest.forEach((uri: string) => uri && RNImage.prefetch(uri).catch(() => { }));
        } catch { }
      }, 100);
    });

    return () => task.cancel();
  }, [productImages]);

  // ✅ If user hasn't selected attributes yet, preload with displayVariant attrs to show price/stock and enable add-to-cart
  useEffect(() => {
    if (!displayVariant) return;
    // if already selected something, skip
    if (Object.keys(selectedAttributes || {}).length > 0) return;

    const attrs = displayVariant.attributes || {};
    const lower: SelectedAttributes = {};
    Object.entries(attrs).forEach(([k, v]) => {
      const key = String(k).trim().toLowerCase();
      const val = String(v ?? "").trim();
      if (key && val) (lower as any)[key] = val;
    });
    if (Object.keys(lower).length > 0) {
      setSelectedAttributes(lower);
    }
  }, [displayVariant, selectedAttributes]);



  const pricing = useMemo(
    () => (viewProduct ? resolvePrice({ product: viewProduct, selectedVariant: matchingVariant || displayVariant }) : null),
    [viewProduct, matchingVariant, displayVariant]
  );

  useEffect(() => {
    if (__DEV__ && viewProduct) {
      console.log("\n================[DEV: PRODUCT DETAILS PAYLOAD]================");
      console.log("PRICING ENGINE RESULT:\n", JSON.stringify(pricing, null, 2));
      console.log("FULL PRODUCT PAYLOAD:\n", JSON.stringify(viewProduct, null, 2));
      console.log("==============================================================\n");
    }
  }, [viewProduct?.id, pricing?.final]);

  const currentPrice = pricing?.final ?? 0;
  const originalPrice = pricing?.original ?? pricing?.merchant ?? 0;
  const productHasDiscount = (pricing?.discount?.amount ?? 0) > 0;

  const formattedFinalPrice = useMemo(
    () => formatPrice(currentPrice),
    [currentPrice]
  );
  const formattedOriginalPrice = useMemo(
    () => (productHasDiscount ? formatPrice(originalPrice) : ""),
    [originalPrice, productHasDiscount]
  );

  const currentStock = useMemo(() => {
    if (displayVariant) return displayVariant.stock ?? 0;
    if (viewProduct && viewProduct.simple?.stock != null) return Number(viewProduct.simple.stock ?? 0);
    return 0;
  }, [displayVariant, viewProduct]);

  /** ✅ required attributes missing? */
  const missingRequiredAttributes = useMemo(() => {
    if (!productAttributes.length) return [];
    const missing: string[] = [];

    for (const attr of productAttributes) {
      const key = String(attr.name ?? "").trim().toLowerCase();
      if (!attr.required) continue;

      const val = (normalizedSelection as any)[key];
      if (!val || String(val).trim().length === 0)
        missing.push(attr.displayName || attr.name);
    }
    return missing;
  }, [productAttributes, normalizedSelection]);

  /** ✅ final add-to-cart permission */
  const canAddToCart = useMemo(() => {
    if (!viewProduct) return false;
    if ((viewProduct as any)?.isActive === false) return false;
    if (missingRequiredAttributes.length > 0) return false;

    // Special case: New backend treats simple products as having 1 variant but 0 attribute definitions
    const isSingleVariantSimple = viewProduct.variants.length === 1 && productAttributes.length === 0;

    // If product has variants, require valid matching selectable variant (or be a single-variant simple)
    if (viewProduct.variants.length > 0) {
      if (!matchingVariant && !isSingleVariantSimple) return false;
      const target = matchingVariant || (isSingleVariantSimple ? viewProduct.variants[0] : null);
      return isVariantSelectable(target);
    }

    // Simple product fallback (legacy)
    const stock = Number(viewProduct.simple?.stock ?? 0);
    return stock > 0;
  }, [viewProduct, missingRequiredAttributes.length, matchingVariant, productAttributes.length]);

  /** wishlist - use optimized selector */
  const inWishlist = useIsInWishlist(viewProduct?.id);

  const handleWishlistPress = useCallback(async () => {
    if (!viewProduct?.id || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      // axios interceptor already attaches auth token
      if (inWishlist) await removeFromWishlist(viewProduct.id);
      else await addToWishlist({ ...(viewProduct as any), _id: viewProduct.id });
    } catch (e) {
      console.error("wishlist error:", e);
    } finally {
      setWishlistLoading(false);
    }
  }, [
    viewProduct?.id,
    wishlistLoading,
    inWishlist,
    removeFromWishlist,
    addToWishlist,
  ]);

  const openImageModal = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);
  const closeImageModal = useCallback(() => setModalVisible(false), []);

  /** ✅ attribute select handler */
  const handleAttributeSelect = useCallback(
    (attrName: string, value: string) => {
      const keyLower = attrName.trim().toLowerCase();
      setSelectedAttributes((prev: SelectedAttributes) => {
        if ((prev as any)[keyLower] === value) return prev;
        return { ...prev, [keyLower]: value };
      });
    },
    []
  );

  const SECTIONS = [
    "CAROUSEL",
    "INFO",
    "ATTRIBUTES",
    "STOCK",
    "DESCRIPTION",
    "RECOMMENDATIONS",
    "REVIEWS",
  ];

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      switch (item) {
        case "CAROUSEL":
          return (
            <ProductImageCarousel
              images={productImages || []}
              colors={colors}
              onImagePress={openImageModal}
            />
          );
        case "INFO":
          return viewProduct ? (
            <View style={[styles.productInfoCard, { backgroundColor: colors.cardBackground }]}>
              {!!viewProduct.categoryName && (
                <Text style={{ fontSize: 13, color: colors.primary, marginBottom: 4, fontWeight: "600", textAlign: I18nManager.isRTL ? "right" : "left", textTransform: "uppercase" }}>
                  {viewProduct.categoryName}
                </Text>
              )}
              <Text style={[styles.productName, { color: colors.text.gray }]}>
                {viewProduct.name}
              </Text>
              <View style={styles.priceContainer}>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  {pricing?.requiresSelection && !isLoading && (
                    <Text style={{ fontSize: 14, color: colors.text.veryLightGray, marginRight: 4 }}>
                      {i18n.t("from") || "From"}
                    </Text>
                  )}
                  {isLoading && !formattedFinalPrice ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.price,
                        { color: productHasDiscount ? COLORS.ERROR_RED : colors.text.gray },
                      ]}
                    >
                      {formattedFinalPrice}
                    </Text>
                  )}
                  {productHasDiscount && (
                    <Text
                      style={[
                        styles.originalPrice,
                        { color: colors.text.veryLightGray, marginLeft: 8 },
                      ]}
                    >
                      {formattedOriginalPrice}
                    </Text>
                  )}
                </View>
                {productHasDiscount && (
                  <View style={[styles.discountBadge, { backgroundColor: COLORS.ERROR_RED }]}>
                    <Text style={styles.discountBadgeText}>
                      {viewProduct?.displayDiscountPercentage || pricing?.discount?.percentage
                        ? `-${Math.round((viewProduct as any)?.displayDiscountPercentage || pricing?.discount?.percentage || 0)}% OFF`
                        : "Sale"}
                    </Text>
                  </View>
                )}
              </View>
              {missingRequiredAttributes.length > 0 && (
                <Text style={[styles.missingText, { color: COLORS.ERROR_RED }]}>
                  {`${i18n.t("pleaseSelect") || "Please select"}: ${missingRequiredAttributes.join(
                    ", "
                  )}`}
                </Text>
              )}
            </View>
          ) : null;
        case "ATTRIBUTES":
          return viewProduct ? (
            <ProductAttributes
              product={viewProduct}
              selectedAttributes={selectedAttributes}
              onAttributeSelect={handleAttributeSelect}
              themeColors={colors}
              pleaseSelectText={i18n.t("pleaseSelect") || "Please select"}
            />
          ) : null;
        case "STOCK":
          return (
            <View style={[styles.stockContainer, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.stockText, { color: colors.text.gray }]}>
                {i18n.t("stock") || "Stock"}:{" "}
                {isLoading && currentStock === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : currentStock > 0 ? (
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>{currentStock}</Text>
                ) : (
                  <Text style={{ color: COLORS.ERROR_RED, fontWeight: "600" }}>
                    {i18n.t("outOfStock") || "Out of Stock"}
                  </Text>
                )}
              </Text>
              {displayVariant?.sku && (
                <Text style={{ fontSize: 13, color: colors.text.veryLightGray, marginTop: 4, paddingBottom: 4, textAlign: I18nManager.isRTL ? "right" : "left" }}>
                  SKU: {displayVariant.sku}
                </Text>
              )}
            </View>
          );
        case "DESCRIPTION":
          return viewProduct && viewProduct.description ? (
            <View style={[styles.descriptionSection, { backgroundColor: colors.cardBackground }]}>
              <Text
                style={[
                  styles.descriptionTitle,
                  {
                    color: colors.text.gray,
                    textAlign: I18nManager.isRTL ? "right" : "left",
                  },
                ]}
              >
                {i18n.t("description") || "Description"}
              </Text>
              <Text
                style={[
                  styles.description,
                  {
                    color: colors.text.veryLightGray,
                    textAlign: I18nManager.isRTL ? "right" : "left",
                  },
                ]}
              >
                {viewProduct.description}
              </Text>
            </View>
          ) : null;
        case "RECOMMENDATIONS":
          return showDeferred ? (
            <View style={{ backgroundColor: colors.surface }}>
              <View style={{ height: 10, backgroundColor: colors.background }} />
              <ProductRecommendations
                recommendations={(recommendations as any) ?? null}
                isLoading={isLoadingRecommendations ?? false}
                colors={colors}
              />
            </View>
          ) : null;
        case "REVIEWS":
          return showDeferred && viewProduct?.id ? (
            <View style={{ backgroundColor: colors.surface }}>
              <View style={{ height: 10, backgroundColor: colors.background }} />
              <Review productId={viewProduct.id} />
              <View style={{ height: 140 }} />
            </View>
          ) : null;
        default:
          return null;
      }
    },
    [
      productImages,
      colors,
      openImageModal,
      viewProduct,
      productHasDiscount,
      pricing,
      formattedFinalPrice,
      formattedOriginalPrice,
      missingRequiredAttributes,
      selectedAttributes,
      handleAttributeSelect,
      currentStock,
      showDeferred,
      recommendations,
      isLoadingRecommendations,
      displayVariant,
    ]
  );


  // Skeleton for Loading Phase (Initial param resolution or active fetch)
  const isInitializing = !viewProduct?.id || isLoading;
  if (isInitializing && !error) {
    return <ProductDetailsSkeleton colors={colors} />;
  }

  // Error State
  if (error && !viewProduct) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="alert-circle-outline" size={60} color={colors.danger || colors.primary} />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.text.gray,
              textAlign: I18nManager.isRTL ? "right" : "left",
            },
          ]}
        >
          {i18n.t("errorLoadingProduct") || "Error loading product"}
        </Text>
        <Text
          style={[
            styles.errorSubText,
            {
              color: colors.text.veryLightGray,
              textAlign: I18nManager.isRTL ? "right" : "left",
            },
          ]}
        >
          {String(error)}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary, marginTop: 24, borderRadius: 12, paddingHorizontal: 30, paddingVertical: 15 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.backButtonText, { color: colors.text.white, fontWeight: 'bold' }]}>
            {i18n.t("backToHome") || "Back to Home"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!viewProduct?.id && !isLoading) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="search-outline" size={60} color={colors.text.veryLightGray} />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.text.gray,
              textAlign: I18nManager.isRTL ? "right" : "left",
            },
          ]}
        >
          {i18n.t("noProductAvailable") || "No product available"}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary, marginTop: 24, borderRadius: 12, paddingHorizontal: 30, paddingVertical: 15 }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.backButtonText, { color: colors.text.white, fontWeight: 'bold' }]}>
            {i18n.t("backToHome") || "Back to Home"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ProductHeader colors={colors} />

      <FlatList
        data={SECTIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={3}
        extraData={{
          selectedAttributes,
          viewProduct,
          displayVariant,
          pricing,
          currentStock,
          missingRequiredAttributes,
          showDeferred,
          recommendations,
          isLoadingRecommendations
        }}
      />

      {/* ✅ Bottom actions */}
      <ProductActions
        product={viewProduct as any}
        selectedAttributes={normalizedSelection}
        isAvailable={canAddToCart}
        wishlistLoading={wishlistLoading}
        inWishlist={inWishlist}
        onWishlistPress={handleWishlistPress}
        themeColors={colors}
      />

      {/* ✅ Fullscreen Zoomable Image Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <ZoomableImage uri={selectedImage} />
          )}
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: { textAlign: "center", fontSize: 18, marginBottom: 8 },
  errorSubText: { textAlign: "center", fontSize: 14, marginBottom: 20 },

  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  backButtonText: { fontSize: 16, fontWeight: "600" },

  productDetails: { paddingBottom: 120 },

  productInfoCard: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 4,
  },
  price: {
    paddingVertical: 4,
    fontSize: 22,
    fontWeight: "800",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  originalPrice: {
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "line-through",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  discountBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  missingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  descriptionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  descriptionTitle: {
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    paddingVertical: 4,
    fontSize: 14,
    lineHeight: 22,
  },

  stockContainer: { paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
  stockText: {
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: "600",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontSize: 24, fontWeight: "300" },
  modalImageContainer: { width: "90%", height: "70%" },
  modalImage: { width: "100%", height: "100%", borderRadius: 6 },
});
