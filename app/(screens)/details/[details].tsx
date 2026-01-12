import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useProductFetch } from "@/hooks/useProductFetch";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import Review from "../../components/Review";
import { Image as RNImage, InteractionManager } from "react-native";
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import type { SelectedAttributes } from "@/types/cart.types";
import { 
  findMatchingVariant,
  getProductStock,
  isProductAvailable 
} from "@/utils/cartUtils";
import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice as formatPriceUtil } from "@/utils/priceUtils";
import { useRecommendationStore } from "@/store/useRecommendationStore";
import useTracking from "@/hooks/useTracking";
import { CURRENCY, COLORS, PRODUCT_DETAILS_CONFIG } from "@/constants/productDetails";
import { ProductHeader } from "@/app/components/ProductDetails/ProductHeader";
import { ProductImageCarousel } from "@/app/components/ProductDetails/ProductImageCarousel";
import { ProductAttributes } from "@/app/components/ProductDetails/ProductAttributes";
import { ProductActions } from "@/app/components/ProductDetails/ProductActions";
import { ProductRecommendations } from "@/app/components/ProductDetails/ProductRecommendations";

/* ───────────────────────────── Main Component ───────────────────────────── */

export default function Details() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { details, name, price, image } = useLocalSearchParams();
  const productId = details ? String(details) : '';
  
  // Direct product fetching instead of store
  const { product, isLoading, error } = useProductFetch(productId);
  
  // Consolidated state management - single source of truth for attributes
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  
  // Legacy support: extract size and color from attributes for backward compatibility
  const selectedSize = useMemo(() => selectedAttributes.size || null, [selectedAttributes]);
  const selectedColor = useMemo(() => selectedAttributes.color || null, [selectedAttributes]);
  
  // Get product attributes (for variant-based products)
  const productAttributes = useMemo(() => {
    return product?.attributes || [];
  }, [product?.attributes]);
  
  // Find matching variant for selected attributes
  const matchingVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) {
      return null;
    }
    return findMatchingVariant(product, selectedAttributes);
  }, [product, selectedAttributes]);
  
  // Get current price (final selling price) and original price
  const currentPrice = useMemo(() => {
    return getFinalPrice(product, matchingVariant || undefined);
  }, [product, matchingVariant]);
  
  const originalPrice = useMemo(() => {
    return getOriginalPrice(product, matchingVariant || undefined);
  }, [product, matchingVariant]);
  
  const productHasDiscount = useMemo(() => {
    return hasDiscount(product, matchingVariant || undefined);
  }, [product, matchingVariant]);
  
  // Get current stock
  const currentStock = useMemo(() => {
    if (!product) return 0;
    return getProductStock(product, selectedAttributes);
  }, [product, selectedAttributes]);
  
  // Check if product/variant is available
  const isAvailable = useMemo(() => {
    if (!product) return false;
    return isProductAvailable(product, selectedAttributes);
  }, [product, selectedAttributes]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();
  const { trackEvent } = useTracking();
  
  // Fetch product recommendations
  const {
    productRecommendations,
    isProductRecommendationsLoading,
    fetchProductRecommendations,
  } = useRecommendationStore();
  
  const recommendations = productRecommendations[productId];
  const isLoadingRecommendations = isProductRecommendationsLoading[productId];
  
  // Fetch recommendations when product loads
  useEffect(() => {
    if (productId) {
      fetchProductRecommendations(productId);
    }
  }, [productId, fetchProductRecommendations]);

  // Track product view
  useEffect(() => {
    if (product && product._id) {
      trackEvent('product_view', {
        productId: product._id,
        screen: 'product_details',
      });
    }
  }, [product?._id, trackEvent]);

  // Use product directly or fallback to optimistic data
  const viewProduct = useMemo(() => {
    if (product) {
      // Return product with default values for missing fields
      return {
        ...product,
        name: product.name || '',
        price: product.price || 0,
        images: product.images || [],
        stock: product.stock || 0,
        sizes: product.sizes || [],
        colors: product.colors || [],
        description: product.description || '',
        attributes: product.attributes || [],
        variants: product.variants || [],
      };
    }
    
    // Fallback to optimistic data from params if available
    if (productId && (name || price || image)) {
      return {
        _id: productId,
        name: (name as string) || '',
        price: price ? Number(price) : 0,
        images: image ? [String(image)] : [],
        stock: 1,
        sizes: [],
        colors: [],
        description: '',
      } as any;
    }
    
    return null;
  }, [product, productId, name, price, image]);
  
  // Get colors from product if available
  const availableColors = useMemo(() => {
    if (viewProduct?.colors && Array.isArray(viewProduct.colors) && viewProduct.colors.length > 0) {
      return viewProduct.colors;
    }
    return [];
  }, [viewProduct?.colors]);
  
  const inWishlist = useMemo(() => {
    return viewProduct?._id ? (isInWishlist(viewProduct._id) ?? false) : false;
  }, [viewProduct?._id, isInWishlist]);

  // Image prefetching with proper error handling
  useEffect(() => {
    if (typeof image === 'string' && image) {
      RNImage.prefetch(image).catch((err) => {
        if (__DEV__) console.warn('Image prefetch failed:', err);
      });
    }
    // Prefetch next images after first render if product exists
    const timeout = setTimeout(() => {
      try {
        const rest = viewProduct?.images?.slice(
          PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
          PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX + PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
        ) || [];
        rest.forEach((uri: string) => {
          if (uri) {
            RNImage.prefetch(uri).catch((err) => {
              if (__DEV__) console.warn('Image prefetch failed:', err);
            });
          }
        });
      } catch (err) {
        if (__DEV__) console.warn('Error prefetching images:', err);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [image, viewProduct?.images]);

  // Defer heavy UI until after transition/tap interactions
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShowDeferred(true);
    });
    return () => task.cancel();
  }, []);

  const formattedFinalPrice = useMemo(() => {
    if (!currentPrice) return '';
    return formatPriceUtil(currentPrice, CURRENCY);
  }, [currentPrice]);
  
  const formattedOriginalPrice = useMemo(() => {
    if (!originalPrice || !productHasDiscount) return '';
    return formatPriceUtil(originalPrice, CURRENCY);
  }, [originalPrice, productHasDiscount]);

  // Initialize attribute selections for variant-based products
  useEffect(() => {
    if (productAttributes && productAttributes.length > 0) {
      const initialAttrs: SelectedAttributes = {};
      productAttributes.forEach(attr => {
        if (attr.type === 'select' && attr.options && attr.options.length > 0) {
          // Auto-select first option for required attributes
          if (attr.required) {
            const firstOption = attr.options[0];
            if (firstOption) {
              initialAttrs[attr.name] = firstOption;
            }
          }
        }
      });
      setSelectedAttributes(initialAttrs);
    }
  }, [productAttributes]);
  
  // Defer initial size selection to avoid blocking interaction
  useEffect(() => {
    if (viewProduct?.sizes && viewProduct.sizes.length > 0 && !selectedAttributes.size) {
      const firstSize = viewProduct.sizes[0];
      if (firstSize) {
        const task = InteractionManager.runAfterInteractions(() => {
          setSelectedAttributes(prev => ({ ...prev, size: firstSize }));
        });
        return () => task.cancel();
      }
    }
    return undefined;
  }, [viewProduct?.sizes, selectedAttributes.size]);
  
  // Set initial color selection only if colors are available
  useEffect(() => {
    if (availableColors && availableColors.length > 0 && !selectedAttributes.color) {
      const firstColor = availableColors[0];
      if (firstColor) {
        setSelectedAttributes(prev => ({ ...prev, color: firstColor }));
      }
    } else if (!availableColors || availableColors.length === 0) {
      // Clear selection if no colors available
      setSelectedAttributes(prev => {
        const { color, ...rest } = prev;
        return rest;
      });
    }
  }, [availableColors, selectedAttributes.color]);
  
  // Handle wishlist toggle
  const handleWishlistPress = useCallback(async () => {
    if (!viewProduct?._id || wishlistLoading) return;
    
    setWishlistLoading(true);
    try {
      const token = await getToken();
      if (inWishlist) {
        await removeFromWishlist(viewProduct._id, token);
      } else {
        await addToWishlist(viewProduct as any, token);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  }, [viewProduct, inWishlist, getToken, addToWishlist, removeFromWishlist, wishlistLoading]);

  // Image modal handlers
  const openImageModal = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Attribute selection handlers
  const handleSizeSelect = useCallback((size: string) => {
    setSelectedAttributes(prev => ({ ...prev, size }));
  }, []);

  const handleColorSelect = useCallback((color: string) => {
    setSelectedAttributes(prev => ({ ...prev, color }));
  }, []);

  const handleAttributeSelect = useCallback((attrName: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [attrName]: value }));
  }, []);

  // Show loading state while fetching product
  if (isLoading && !viewProduct) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.veryLightGray }]}>
          {i18n.t('loading') || 'Loading...'}
        </Text>
      </View>
    );
  }

  // Show error state if fetch failed and no fallback data
  if (error && !viewProduct) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('errorLoadingProduct') || 'Error loading product'}
        </Text>
        <Text style={[styles.errorSubText, { color: colors.text.veryLightGray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {error}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace("/(tabs)")}
          accessibilityLabel="Back to home"
          accessibilityRole="button"
        >
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>
            {i18n.t('backToHome') || 'Back to Home'}
          </Text>
        </Pressable>
      </View>
    );
  }

  // Early return for no product at all (no params either)
  if (!viewProduct || !viewProduct._id) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.errorText, { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('noProductAvailable') || 'No product available'}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.accent }]}
          onPress={() => router.replace("/(tabs)")}
          accessibilityLabel="Back to home"
          accessibilityRole="button"
        >
          <Text style={[styles.backButtonText, { color: colors.text.white }]}>
            {i18n.t('backToHome') || 'Back to Home'}
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
        removeClippedSubviews={true}
      >
        <ProductImageCarousel
          images={viewProduct.images}
          colors={colors}
          onImagePress={openImageModal}
        />

        <View style={[styles.productDetails, { backgroundColor: colors.surface }]}>
          {/* Product Name and Price */}
          <View style={[styles.productInfoCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.productName, { color: colors.text.gray }]}>
              {viewProduct.name}
            </Text>
            <View style={styles.priceContainer}>
              {productHasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>
                  {formattedOriginalPrice}
                </Text>
              )}
              <Text style={[styles.price, { color: colors.text.gray }]}>
                {formattedFinalPrice}
              </Text>
            </View>
          </View>

          {/* Description */}
          {viewProduct.description && (
            <View style={[styles.descriptionSection, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.descriptionTitle, { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {i18n.t('description') || 'Description'}
              </Text>
              <Text style={[styles.description, { color: colors.text.veryLightGray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {viewProduct.description}
              </Text>
            </View>
          )}

          {/* Attributes Selector */}
          <ProductAttributes
            sizes={viewProduct.sizes}
            colors={availableColors}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSizeSelect={handleSizeSelect}
            onColorSelect={handleColorSelect}
            attributes={productAttributes}
            selectedAttributes={selectedAttributes}
            onAttributeSelect={handleAttributeSelect}
            themeColors={colors}
          />
          
          {/* Stock Display */}
          <View style={[styles.stockContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.stockText, { color: colors.text.gray }]}>
              {i18n.t('stock') || 'Stock'}: {currentStock > 0 ? (
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {currentStock}
                </Text>
              ) : (
                <Text style={{ color: COLORS.ERROR_RED, fontWeight: '600' }}>
                  {i18n.t('outOfStock') || 'Out of Stock'}
                </Text>
              )}
            </Text>
          </View>

          {/* Review Section (deferred) */}
          {showDeferred && <Review productId={viewProduct._id} />}

          {/* Recommendation Sections */}
          {showDeferred && recommendations && (
            <ProductRecommendations
              recommendations={recommendations}
              isLoading={isLoadingRecommendations ?? false}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <ProductActions
        product={viewProduct}
        selectedSize={selectedSize}
        selectedAttributes={selectedAttributes}
        isAvailable={isAvailable}
        wishlistLoading={wishlistLoading}
        inWishlist={inWishlist}
        onWishlistPress={handleWishlistPress}
        themeColors={colors}
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
        animationType="fade"
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
            accessibilityLabel="Close image"
            accessibilityRole="button"
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityLabel="Product image"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 8,
  },
  errorSubText: {
    textAlign: "center",
    fontSize: 14,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  productDetails: {
    paddingBottom: 120,
  },
  productInfoCard: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 32,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: "400",
    textDecorationLine: 'line-through',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  stockContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 8,
  },
  stockText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  modalImage: {
    width: '90%',
    height: '70%',
    borderRadius: 4,
  },
});
