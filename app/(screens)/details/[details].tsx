import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
} from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { Image as RNImage } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProductFetch } from "@/hooks/useProductFetch";
import useWishlistStore from "@/store/wishlistStore";
import { useAuth } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";

import type {
  ProductAttribute,
  ProductVariant,
  SelectedAttributes,
} from "@/types/cart.types";
import {
  findMatchingVariant,
  getProductStock,
  normalizeAttributes,
} from "@/utils/cartUtils";
import { buildAttributeOptions } from "@/utils/productUtils";
import {
  getFinalPrice,
  getOriginalPrice,
  hasDiscount,
  formatPrice,
} from "@/utils/priceUtils";

import { useRecommendationStore } from "@/store/useRecommendationStore";
import useTracking from "@/hooks/useTracking";
import {
  CURRENCY,
  COLORS,
  PRODUCT_DETAILS_CONFIG,
} from "@/constants/productDetails";

import { ProductHeader } from "@/app/components/ProductDetails/ProductHeader";
import { ProductImageCarousel } from "@/app/components/ProductDetails/ProductImageCarousel";
import { ProductAttributes } from "@/app/components/ProductDetails/ProductAttributes";
import Review from "../../components/Review";
import { ProductRecommendations } from "@/app/components/ProductDetails/ProductRecommendations";
import { ProductActions } from "@/app/components/ProductDetails/ProductActions";

/** --------- local lightweight types --------- */
type VariantLike = {
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

type ProductLike = {
  _id: string;
  name?: string;
  description?: string;
  images?: string[];
  stock?: number;
  isActive?: boolean;
  variants?: ProductVariant[] | VariantLike[];
  attributes?: ProductAttribute[];
  merchantPrice?: number;
  finalPrice?: number;
  price?: number;
  discountPrice?: number;
};

function toLowerKey(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function uniqStrings(arr: any[]) {
  const set = new Set<string>();
  for (const v of arr) {
    const val = String(v ?? "").trim();
    if (val) set.add(val);
  }
  return Array.from(set);
}

export default function Details() {
  const { theme } = useTheme();
  const colors = theme.colors;

  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.details ? String(params.details) : "";

  const { product, isLoading, error } = useProductFetch(productId);

  const { addToWishlist, removeFromWishlist, isInWishlist } =
    useWishlistStore();
  const { getToken } = useAuth();
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

  useEffect(() => {
    if (productId) fetchProductRecommendations(productId);
  }, [productId, fetchProductRecommendations]);

  // track once per product
  useEffect(() => {
    const id = (product as any)?._id;
    if (!id) return;
    if (lastTrackedRef.current === id) return;
    lastTrackedRef.current = id;
    trackEvent("product_view", { productId: id, screen: "product_details" });
  }, [(product as any)?._id, trackEvent]);

  /** viewProduct fallback */
  const viewProduct = useMemo<ProductLike | null>(() => {
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
        description: "",
        variants: [],
        attributes: [],
        isActive: true,
      };
    }
    return null;
  }, [product, productId, params.name, params.price, params.image]);

  const productImages = useMemo(
    () => viewProduct?.images || [],
    [viewProduct?.images]
  );

  // Prefetch images
  useEffect(() => {
    const first = productImages?.[0];
    if (first) RNImage.prefetch(first).catch(() => {});
    const timeout = setTimeout(() => {
      try {
        const rest =
          productImages?.slice(
            PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
            PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX +
              PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
          ) || [];
        rest.forEach(
          (uri: string) => uri && RNImage.prefetch(uri).catch(() => {})
        );
      } catch {}
    }, 0);

    return () => clearTimeout(timeout);
  }, [productImages]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() =>
      setShowDeferred(true)
    );
    return () => task.cancel();
  }, []);

  const productAttributes = useMemo(
    () => (viewProduct?.attributes || []) as ProductAttribute[],
    [viewProduct?.attributes]
  );

  /** ✅ normalize selection (keys lowercase) */
  const normalizedSelection = useMemo(
    () => normalizeAttributes(selectedAttributes),
    [selectedAttributes]
  );

  /** ✅ optionsMap derived (attributes -> variants -> legacy) */
  const optionsMap = useMemo(() => {
    const p: any = viewProduct;
    const base = buildAttributeOptions(p) || {};

    // Ensure attribute options exist even if attr.type === "text"
    // Pull from variants.attributes
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    for (const v of variants) {
      const attrs = v?.attributes;
      let obj: Record<string, any> = {};
      if (attrs instanceof Map) obj = Object.fromEntries(attrs.entries());
      else if (attrs && typeof attrs === "object") obj = attrs;

      for (const [k, val] of Object.entries(obj)) {
        const key = toLowerKey(k);
        if (!key) continue;
        base[key] = base[key] || [];
        base[key].push(String(val ?? "").trim());
      }
    }

    // legacy fallback
    if (Array.isArray(p?.sizes) && p.sizes.length) {
      base["size"] = uniqStrings([...(base["size"] || []), ...p.sizes]);
    }
    if (Array.isArray(p?.colors) && p.colors.length) {
      base["color"] = uniqStrings([...(base["color"] || []), ...p.colors]);
    }

    // de-dupe
    for (const k of Object.keys(base)) {
      base[k] = uniqStrings(base[k] || []);
    }

    return base as Record<string, string[]>;
  }, [viewProduct]);

  /** ✅ auto-init required attributes when options exist (regardless of type) */
  useEffect(() => {
    if (!productAttributes.length) return;

    setSelectedAttributes((prev) => {
      const next: SelectedAttributes = { ...prev };
      let changed = false;

      for (const attr of productAttributes) {
        const key = String(attr.name ?? "")
          .trim()
          .toLowerCase();

        const options =
          (Array.isArray(attr.options) && attr.options.length
            ? attr.options
            : optionsMap[key]) || [];

        // ✅ هنا التعديل: شيلنا شرط attr.type === "select"
        if (attr.required && options.length > 0) {
          if (!(next as any)[key]) {
            (next as any)[key] = options[0]!;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [productAttributes, optionsMap]);

  /** ✅ resolve variant based on normalizedSelection */
  const matchingVariant = useMemo<VariantLike | null>(() => {
    const variants = (viewProduct as any)?.variants;
    if (!Array.isArray(variants) || variants.length === 0) return null;
    return findMatchingVariant(
      viewProduct as any,
      normalizedSelection as any
    ) as any;
  }, [viewProduct, normalizedSelection]);

  // debug (remove later)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("selection:", normalizedSelection);
    // eslint-disable-next-line no-console
    console.log(
      "matchingVariant:",
      matchingVariant?._id,
      matchingVariant?.finalPrice,
      matchingVariant?.stock
    );
  }, [normalizedSelection, matchingVariant]);

  /** ✅ pricing (variant-first) */
  const currentPrice = useMemo(() => {
    return getFinalPrice(viewProduct as any, {
      selectedAttributes: normalizedSelection as any,
      variant: matchingVariant ?? null,
      includeOutOfStockVariants: true,
      includeInactiveVariants: false,
      clampToZero: true,
    });
  }, [viewProduct, normalizedSelection, matchingVariant]);

  const originalPrice = useMemo(() => {
    return getOriginalPrice(viewProduct as any, {
      selectedAttributes: normalizedSelection as any,
      variant: matchingVariant ?? null,
      includeOutOfStockVariants: true,
      includeInactiveVariants: false,
      clampToZero: true,
    });
  }, [viewProduct, normalizedSelection, matchingVariant]);

  const productHasDiscount = useMemo(() => {
    return hasDiscount(viewProduct as any, {
      selectedAttributes: normalizedSelection as any,
      variant: matchingVariant ?? null,
      includeOutOfStockVariants: true,
      includeInactiveVariants: false,
      clampToZero: true,
    });
  }, [viewProduct, normalizedSelection, matchingVariant]);

  const formattedFinalPrice = useMemo(
    () => formatPrice(currentPrice, CURRENCY),
    [currentPrice]
  );
  const formattedOriginalPrice = useMemo(
    () => (productHasDiscount ? formatPrice(originalPrice, CURRENCY) : ""),
    [originalPrice, productHasDiscount]
  );

  /** ✅ stock + availability (variant-first, strict) */
  const currentStock = useMemo(() => {
    if (!viewProduct) return 0;
    // if variants exist, prefer matchingVariant stock
    if (
      Array.isArray(viewProduct.variants) &&
      viewProduct.variants.length > 0
    ) {
      return matchingVariant ? matchingVariant.stock ?? 0 : 0;
    }
    return getProductStock(viewProduct as any, normalizedSelection as any);
  }, [viewProduct, normalizedSelection, matchingVariant]);

  /** ✅ required attributes missing? */
  const missingRequiredAttributes = useMemo(() => {
    if (!productAttributes.length) return [];
    const missing: string[] = [];

    for (const attr of productAttributes) {
      const key = toLowerKey(attr.name);
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

    const variants = (viewProduct as any)?.variants;
    const hasVariants = Array.isArray(variants) && variants.length > 0;

    // لو عنده variants لازم نلقى matchingVariant
    if (hasVariants) {
      if (!matchingVariant) return false;
      return (
        (matchingVariant.stock ?? 0) > 0 && matchingVariant.isActive !== false
      );
    }

    // لو ما عنده variants اعتمد على stock
    return (viewProduct.stock ?? 0) > 0;
  }, [viewProduct, missingRequiredAttributes.length, matchingVariant]);

  /** wishlist */
  const inWishlist = useMemo(() => {
    return viewProduct?._id ? isInWishlist(viewProduct._id) ?? false : false;
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
  }, [
    viewProduct?._id,
    wishlistLoading,
    getToken,
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
      setSelectedAttributes((prev) => {
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

  if (!viewProduct?._id) {
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
              <Text style={[styles.price, { color: colors.text.gray }]}>
                {formattedFinalPrice}
              </Text>
            </View>

            {missingRequiredAttributes.length > 0 && (
              <Text style={[styles.missingText, { color: COLORS.ERROR_RED }]}>
                {`${
                  i18n.t("pleaseSelect") || "Please select"
                }: ${missingRequiredAttributes.join(", ")}`}
              </Text>
            )}
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

          {/* ✅ Attributes */}
          <ProductAttributes
            product={viewProduct as any}
            attributes={productAttributes}
            selectedAttributes={selectedAttributes}
            onAttributeSelect={handleAttributeSelect}
            themeColors={colors}
            optionsMap={optionsMap}
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

          <ProductRecommendations
            recommendations={(recommendations as any) ?? null}
            isLoading={isLoadingRecommendations ?? false}
            colors={colors}
          />

          {showDeferred && <Review productId={viewProduct?._id} />}
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

      <Modal
        visible={modalVisible}
        transparent
        onRequestClose={closeImageModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
        </View>
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
    fontSize: 24,
    fontWeight: "700",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: "400",
    textDecorationLine: "line-through",
  },

  missingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    textAlign: I18nManager.isRTL ? "right" : "left",
  },

  descriptionSection: { paddingHorizontal: 20, paddingVertical: 20 },
  descriptionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 4 },

  stockContainer: { paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 },
  stockText: {
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
  modalImage: { width: "90%", height: "70%", borderRadius: 6 },
});
