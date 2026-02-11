import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { GestureHandlerRootView, GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  InteractionManager,
  Image as RNImage,
} from "react-native";
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

  const productAttributes = useMemo(() => viewProduct?.attributeDefs ?? [], [viewProduct]);

  const normalizedSelection = useMemo(
    () => normalizeSelectedAttributes(selectedAttributes),
    [selectedAttributes]
  );

  const optionsMap = useMemo(() => (viewProduct ? getAttributeOptions(viewProduct) : {}), [viewProduct]);

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
    // If product has variants, require valid matching selectable variant
    if (viewProduct.variants.length > 0) {
      if (!matchingVariant) return false;
      return isVariantSelectable(matchingVariant);
    }
    // Simple product: rely on simple stock
    const stock = Number(viewProduct.simple?.stock ?? 0);
    return stock > 0;
  }, [viewProduct, missingRequiredAttributes.length, matchingVariant]);

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

  // Loading
  if (isLoading && !viewProduct) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.surface }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[styles.loadingText, { color: colors.text.veryLightGray }]}
        >
          {i18n.t("loading") || "Loading..."}
        </Text>
      </View>
    );
  }

  // Error
  if (error && !viewProduct) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.surface }]}
      >
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
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>
            {i18n.t("backToHome") || "Back to Home"}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!viewProduct?.id) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.surface }]}
      >
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
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>
            {i18n.t("backToHome") || "Back to Home"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ProductHeader colors={colors} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews
      >
        <ProductImageCarousel
          images={productImages || []}
          colors={colors}
          onImagePress={openImageModal}
        />

        <View
          style={[styles.productDetails, { backgroundColor: colors.surface }]}
        >
          <View
            style={[
              styles.productInfoCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.productName, { color: colors.text.gray }]}>
              {viewProduct.name}
            </Text>

            <View style={styles.priceContainer}>
              {productHasDiscount && (
                <Text
                  style={[
                    styles.originalPrice,
                    { color: colors.text.veryLightGray },
                  ]}
                >
                  {formattedOriginalPrice}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                {pricing?.requiresSelection && (
                  <Text style={{ fontSize: 14, color: colors.text.veryLightGray, marginRight: 4 }}>
                    {i18n.t("from") || "From"}
                  </Text>
                )}
                <Text style={[styles.price, { color: colors.text.gray }]}>
                  {formattedFinalPrice}
                </Text>
              </View>
            </View>

            {missingRequiredAttributes.length > 0 && (
              <Text style={[styles.missingText, { color: COLORS.ERROR_RED }]}>
                {`${i18n.t("pleaseSelect") || "Please select"
                  }: ${missingRequiredAttributes.join(", ")}`}
              </Text>
            )}
          </View>
          {/* ✅ Attributes */}
          <ProductAttributes
            product={viewProduct}
            selectedAttributes={selectedAttributes}
            onAttributeSelect={handleAttributeSelect}
            themeColors={colors}
            pleaseSelectText={i18n.t("pleaseSelect") || "Please select"}
          />
          <View
            style={[
              styles.stockContainer,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.stockText, { color: colors.text.gray }]}>
              {i18n.t("stock") || "Stock"}:{" "}
              {currentStock > 0 ? (
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {currentStock}
                </Text>
              ) : (
                <Text style={{ color: COLORS.ERROR_RED, fontWeight: "600" }}>
                  {i18n.t("outOfStock") || "Out of Stock"}
                </Text>
              )}
            </Text>
          </View>

          {!!viewProduct.description && (
            <View
              style={[
                styles.descriptionSection,
                { backgroundColor: colors.cardBackground },
              ]}
            >
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
          )}
          <View style={{ flex: 1, height: 10, backgroundColor: colors.background }} />

          {showDeferred && (
            <ProductRecommendations
              recommendations={(recommendations as any) ?? null}
              isLoading={isLoadingRecommendations ?? false}
              colors={colors}
            />
          )}

          {showDeferred && <Review productId={viewProduct?.id} />}
        </View>
      </ScrollView>

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

  productDetails: { paddingBottom: 140 },

  productInfoCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 32,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  price: {
    padding: 10,
    fontSize: 24,
    fontWeight: "700",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  originalPrice: {
    padding: 10,
    fontSize: 18,
    fontWeight: "400",
    textDecorationLine: "line-through",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  missingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  descriptionSection: { paddingHorizontal: 20, paddingVertical: 10, marginBottom: 26 },
  descriptionTitle: { padding: 10, fontSize: 16, fontWeight: "600", marginBottom: 12 },
  description: { padding: 10, fontSize: 14, lineHeight: 22, marginBottom: 4 },

  stockContainer: { paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
  stockText: {
    padding: 10,
    fontSize: 16,
    fontWeight: "500",
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
