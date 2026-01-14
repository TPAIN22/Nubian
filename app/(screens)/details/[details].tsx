import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { View, ScrollView, StyleSheet, Pressable, Modal, TouchableOpacity, ActivityIndicator, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { Image as RNImage, InteractionManager } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProductFetch } from "@/hooks/useProductFetch";
import useWishlistStore from "@/store/wishlistStore";
import { useAuth } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";

import type { ProductAttribute, SelectedAttributes } from "@/types/cart.types";
import { findMatchingVariant, getProductStock, isProductAvailable, mergeSizeAndAttributes, normalizeAttributes } from "@/utils/cartUtils";

import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice } from "@/utils/priceUtils";
import { getAvailableColors, getAvailableSizes, getProductImages } from "@/utils/productUtils";

import { useRecommendationStore } from "@/store/useRecommendationStore";
import useTracking from "@/hooks/useTracking";
import { CURRENCY, COLORS, PRODUCT_DETAILS_CONFIG } from "@/constants/productDetails";

import { ProductHeader } from "@/app/components/ProductDetails/ProductHeader";
import { ProductImageCarousel } from "@/app/components/ProductDetails/ProductImageCarousel";
import { ProductAttributes } from "@/app/components/ProductDetails/ProductAttributes";
import { ProductActions } from "@/app/components/ProductDetails/ProductActions";
import Review from "../../components/Review";
import ProductRecommendationsSection from "@/app/components/ProductRecommendationsSection";



type Variant = {
  _id?: string;
  merchantPrice?: number;
  finalPrice?: number;
  price?: number;
  discountPrice?: number;
  stock?: number;
  images?: string[];
  isActive?: boolean;
  attributes?: Record<string, string> | Map<string, string>;
};

type Product = {
  _id: string;
  name: string;
  description?: string;

  images?: string[];
  stock?: number;

  price?: number;
  discountPrice?: number;
  sizes?: string[];
  colors?: string[];

  merchantPrice?: number;
  finalPrice?: number;

  attributes?: Array<{
    name: string;
    displayName: string;
    type: "select" | "text" | "number";
    required?: boolean;
    options?: string[];
  }>;

  variants?: Variant[];
};

export default function Details() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.details ? String(params.details) : "";

  const { product, isLoading, error } = useProductFetch(productId);

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();
  const { trackEvent } = useTracking();

  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ✅ prevent infinite tracking
  const lastTrackedRef = useRef<string | null>(null);

  // recommendations
  const { productRecommendations, isProductRecommendationsLoading, fetchProductRecommendations } = useRecommendationStore();
  const recommendations = productRecommendations[productId];
  const isLoadingRecommendations = isProductRecommendationsLoading[productId];

  useEffect(() => {
    if (productId) fetchProductRecommendations(productId);
  }, [productId, fetchProductRecommendations]);

  // ✅ track once per product
  useEffect(() => {
    const id = product?._id;
    if (!id) return;
    if (lastTrackedRef.current === id) return;
    lastTrackedRef.current = id;
    trackEvent("product_view", { productId: id, screen: "product_details" });
  }, [product?._id, trackEvent]);

  // viewProduct (fallback)
  const viewProduct = useMemo<Product | null>(() => {
    if (product) return product as any;

    const name = params.name ? String(params.name) : "";
    const price = params.price ? Number(params.price) : 0;
    const image = params.image ? String(params.image) : "";

    if (productId && (name || price || image)) {
      return {
        _id: productId,
        name,
        price,
        merchantPrice: price,
        finalPrice: price,
        images: image ? [image] : [],
        stock: 1,
        sizes: [],
        colors: [],
        description: "",
        variants: [],
        attributes: [],
      };
    }
    return null;
  }, [product, productId, params.name, params.price, params.image]);

  const productImages = useMemo(() => getProductImages(viewProduct), [viewProduct]);

  // Prefetch images
  useEffect(() => {
    const first = productImages?.[0];
    if (first) RNImage.prefetch(first).catch(() => {});
    const timeout = setTimeout(() => {
      try {
        const rest = productImages?.slice(
          PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
          PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX + PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
        ) || [];
        rest.forEach((uri) => uri && RNImage.prefetch(uri).catch(() => {}));
      } catch {}
    }, 0);
    return () => clearTimeout(timeout);
  }, [productImages]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setShowDeferred(true));
    return () => task.cancel();
  }, []);

  const productAttributes = useMemo(() => viewProduct?.attributes || [], [viewProduct?.attributes]);
  const availableSizes = useMemo(() => getAvailableSizes(viewProduct), [viewProduct]);
  const availableColors = useMemo(() => getAvailableColors(viewProduct), [viewProduct]);

  // ✅ auto-init required attributes (guard to avoid loops)
  useEffect(() => {
    if (!productAttributes.length) return;

    setSelectedAttributes((prev) => {
      const next: SelectedAttributes = { ...prev };
      let changed = false;

      for (const attr of productAttributes) {
        if (attr.type === "select" && attr.required && Array.isArray(attr.options) && attr.options.length > 0) {
          if (!next[attr.name]) {
            next[attr.name] = attr.options[0]!;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [productAttributes]);

  // ✅ init size from legacy sizes if product defines size attr (or has sizes[])
  useEffect(() => {
    const firstSize = availableSizes?.[0];
    if (!firstSize) return;

    setSelectedAttributes((prev) => {
      if (prev.size) return prev;
      return { ...prev, size: firstSize };
    });
  }, [availableSizes]);

  // ✅ init color only if exist (guard)
  useEffect(() => {
    setSelectedAttributes((prev) => {
      const hasAnyColor = !!(prev as any).color || !!(prev as any).Color;
      if (availableColors.length === 0) {
        if (!hasAnyColor) return prev;
        const { color, Color, ...rest } = prev as any;
        return rest;
      }
      if (hasAnyColor) return prev;
      return { ...prev, color: availableColors[0]! };
    });
  }, [availableColors]);

  const selectedSize = useMemo(() => (selectedAttributes as any).size || null, [selectedAttributes]);
  const selectedColor = useMemo(
    () => (selectedAttributes as any).color || (selectedAttributes as any).Color || null,
    [selectedAttributes]
  );

  // ✅ merged attrs (consistent for matching + stock + availability)
  const mergedAttributes = useMemo(
    () => mergeSizeAndAttributes(selectedSize, selectedAttributes),
    [selectedSize, selectedAttributes]
  );

  // ✅ resolve variant
  const matchingVariant = useMemo<Variant | null>(() => {
    if (!viewProduct?.variants?.length) return null;
    return findMatchingVariant(viewProduct as any, normalizeAttributes(mergedAttributes) as any) as any;
  }, [viewProduct, mergedAttributes]);

  // ✅ pricing options:
  // - if user selected attrs -> selectedAttributes strategy
  // - if no attrs yet -> firstActive (prevents flicker)
  const priceOptions = useMemo(() => {
    const hasSelection = Object.keys(normalizeAttributes(mergedAttributes)).length > 0;
    return {
      strategy: hasSelection ? ("selectedAttributes" as const) : ("firstActive" as const),
      selectedAttributes: hasSelection ? (normalizeAttributes(mergedAttributes) as any) : undefined,
      variant: matchingVariant ?? null,
      includeInactiveVariants: false,
      includeOutOfStockVariants: false,
      clampToZero: true,
    };
  }, [mergedAttributes, matchingVariant]);

  const currentPrice = useMemo(() => {
    return getFinalPrice(viewProduct as any, {
      selectedAttributes,
      strategy: "selectedAttributes",
      includeOutOfStockVariants: true, // اختياري
    });
  }, [viewProduct, selectedAttributes]);
  
  const originalPrice = useMemo(() => {
    return getOriginalPrice(viewProduct as any, {
      selectedAttributes,
      strategy: "selectedAttributes",
      includeOutOfStockVariants: true,
    });
  }, [viewProduct, selectedAttributes]);
  
  const productHasDiscount = useMemo(() => {
    return hasDiscount(viewProduct as any, { selectedAttributes, strategy: "selectedAttributes" });
  }, [viewProduct, selectedAttributes]);
  
  const formattedFinalPrice = useMemo(() => formatPrice(currentPrice, CURRENCY), [currentPrice]);
  const formattedOriginalPrice = useMemo(
    () => (productHasDiscount ? formatPrice(originalPrice, CURRENCY) : ""),
    [originalPrice, productHasDiscount]
  );

  // stock + availability (variant-first)
  const currentStock = useMemo(() => {
    if (!viewProduct) return 0;
    return getProductStock(viewProduct as any, normalizeAttributes(mergedAttributes) as any);
  }, [viewProduct, mergedAttributes]);

  const isAvailable = useMemo(() => {
    if (!viewProduct) return false;
    return isProductAvailable(viewProduct as any, normalizeAttributes(mergedAttributes) as any);
  }, [viewProduct, mergedAttributes]);

  // wishlist
  const inWishlist = useMemo(() => {
    return viewProduct?._id ? (isInWishlist(viewProduct._id) ?? false) : false;
  }, [viewProduct?._id, isInWishlist]);

  const handleWishlistPress = useCallback(async () => {
    if (!viewProduct?._id || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      if (inWishlist) await removeFromWishlist(viewProduct._id, token);
      else await addToWishlist(viewProduct as any, token);
    } catch (e) {
      console.error("wishlist error:", e);
    } finally {
      setWishlistLoading(false);
    }
  }, [viewProduct?._id, wishlistLoading, getToken, inWishlist, removeFromWishlist, addToWishlist]);

  const openImageModal = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);
  const closeImageModal = useCallback(() => setModalVisible(false), []);

  const handleSizeSelect = useCallback((size: string) => {
    setSelectedAttributes((prev) => {
      if ((prev as any).size === size) return prev;
      return { ...prev, size };
    });
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedAttributes((prev) => {
      const next: any = { ...prev, color };
      delete next.Color;
      return next;
    });
  }, []);

  const handleAttributeSelect = useCallback((attrName: string, value: string) => {
    setSelectedAttributes((prev) => {
      if ((prev as any)[attrName] === value) return prev;
      return { ...prev, [attrName]: value };
    });
  }, []);

  // Loading
  if (isLoading && !viewProduct) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.veryLightGray }]}>
          {i18n.t("loading") || "Loading..."}
        </Text>
      </View>
    );
  }

  // Error
  if (error && !viewProduct) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.text.gray, textAlign: I18nManager.isRTL ? "right" : "left" }]}>
          {i18n.t("errorLoadingProduct") || "Error loading product"}
        </Text>
        <Text style={[styles.errorSubText, { color: colors.text.veryLightGray, textAlign: I18nManager.isRTL ? "right" : "left" }]}>
          {String(error)}
        </Text>
        <Pressable style={[styles.backButton, { backgroundColor: colors.accent }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>{i18n.t("backToHome") || "Back to Home"}</Text>
        </Pressable>
      </View>
    );
  }

  if (!viewProduct?._id) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.text.gray, textAlign: I18nManager.isRTL ? "right" : "left" }]}>
          {i18n.t("noProductAvailable") || "No product available"}
        </Text>
        <Pressable style={[styles.backButton, { backgroundColor: colors.accent }]} onPress={() => router.replace("/(tabs)")}>
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>{i18n.t("backToHome") || "Back to Home"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ProductHeader colors={colors} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false} removeClippedSubviews>
        <ProductImageCarousel images={productImages || []} colors={colors} onImagePress={openImageModal} />

        <View style={[styles.productDetails, { backgroundColor: colors.surface }]}>
          <View style={[styles.productInfoCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.productName, { color: colors.text.gray }]}>{viewProduct.name}</Text>

            <View style={styles.priceContainer}>
              {productHasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>{formattedOriginalPrice}</Text>
              )}
              <Text style={[styles.price, { color: colors.text.gray }]}>{formattedFinalPrice}</Text>
            </View>
          </View>

          {!!viewProduct.description && (
            <View style={[styles.descriptionSection, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.descriptionTitle, { color: colors.text.gray, textAlign: I18nManager.isRTL ? "right" : "left" }]}>
                {i18n.t("description") || "Description"}
              </Text>
              <Text style={[styles.description, { color: colors.text.veryLightGray, textAlign: I18nManager.isRTL ? "right" : "left" }]}>
                {viewProduct.description}
              </Text>
            </View>
          )}

          <ProductAttributes
            sizes={availableSizes}
            colors={availableColors}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSizeSelect={handleSizeSelect}
            onColorSelect={handleColorSelect}
            attributes={productAttributes as unknown as ProductAttribute[]}
            selectedAttributes={selectedAttributes}
            onAttributeSelect={handleAttributeSelect}
            themeColors={colors}
          />

          <View style={[styles.stockContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.stockText, { color: colors.text.gray }]}>
              {i18n.t("stock") || "Stock"}:{" "}
              {currentStock > 0 ? (
                <Text style={{ color: colors.primary, fontWeight: "600" }}>{currentStock}</Text>
              ) : (
                <Text style={{ color: COLORS.ERROR_RED, fontWeight: "600" }}>{i18n.t("outOfStock") || "Out of Stock"}</Text>
              )}
            </Text>
          </View>   
          <ProductRecommendationsSection productId={viewProduct?._id} />
          {showDeferred && <Review productId={viewProduct?._id} />}
        </View>
      </ScrollView>

      <ProductActions
        product={viewProduct as any}
        selectedSize={selectedSize}
        selectedAttributes={selectedAttributes}
        isAvailable={isAvailable}
        wishlistLoading={wishlistLoading}
        inWishlist={inWishlist}
        onWishlistPress={handleWishlistPress}
        themeColors={colors}
      />

      <Modal visible={modalVisible} transparent onRequestClose={closeImageModal} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeImageModal}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.modalImage} contentFit="contain" cachePolicy="memory-disk" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { fontSize: 16, marginTop: 16, textAlign: I18nManager.isRTL ? "right" : "left" },

  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { textAlign: "center", fontSize: 18, marginBottom: 8 },
  errorSubText: { textAlign: "center", fontSize: 14, marginBottom: 20 },

  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  backButtonText: { fontSize: 16, fontWeight: "600" },

  productDetails: { paddingBottom: 120 },

  productInfoCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  productName: { fontSize: 24, fontWeight: "700", marginBottom: 8, lineHeight: 32, textAlign: I18nManager.isRTL ? "right" : "left" },

  priceContainer: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 },
  price: { fontSize: 24, fontWeight: "700", textAlign: I18nManager.isRTL ? "right" : "left" },
  originalPrice: { fontSize: 18, fontWeight: "400", textDecorationLine: "line-through" },

  descriptionSection: { paddingHorizontal: 20, paddingVertical: 20 },
  descriptionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 4 },

  stockContainer: { paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
  stockText: { fontSize: 16, fontWeight: "500", textAlign: I18nManager.isRTL ? "right" : "left" },

  modalContainer: { flex: 1, backgroundColor: COLORS.MODAL_BACKGROUND, justifyContent: "center", alignItems: "center" },
  modalCloseButton: { position: "absolute", top: 50, right: 20, zIndex: 2, width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  modalCloseText: { color: "#fff", fontSize: 24, fontWeight: "300" },
  modalImage: { width: "90%", height: "70%", borderRadius: 6 },
});
