import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import AddToCartButton from "../../components/AddToCartButton";
import { useProductFetch } from "@/hooks/useProductFetch";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import Review from "../../components/Review";
import { Image as RNImage, InteractionManager, I18nManager } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/locales/brandColors";
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import type { SelectedAttributes, ProductAttribute, ProductVariant } from "@/types/cart.types";
import { 
  mergeSizeAndAttributes, 
  findMatchingVariant,
  getProductStock,
  isProductAvailable 
} from "@/utils/cartUtils";
import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice as formatPriceUtil } from "@/utils/priceUtils";
import { useRecommendationStore } from "@/store/useRecommendationStore";
import { HomeProduct } from "@/app/_api/recommendations.api";
import ItemCard from "../../components/Card";
import ItemCardSkeleton from "../../components/ItemCardSkeleton";
import { navigateToProduct, navigateToStore } from "@/utils/deepLinks";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.45;

// Pre-calculate styles outside component to avoid recreation
const imageHeight = screenWidth * 1.1;

/* ───────────────────────────── Recommendation Section Component ───────────────────────────── */

interface RecommendationSectionProps {
  title: string;
  products: HomeProduct[];
  colors: any;
  isLoading?: boolean;
  router: any;
}

const RecommendationSection = memo(({ 
  title, 
  products, 
  colors, 
  isLoading = false,
  router 
}: RecommendationSectionProps) => {
  if (isLoading) {
    return (
      <View style={recommendationStyles.section}>
        <View style={recommendationStyles.sectionHeader}>
          <View style={[recommendationStyles.accentBar, { backgroundColor: colors.primary }]} />
          <Text style={[recommendationStyles.sectionTitle, { color: colors.text.gray }]}>
            {title}
          </Text>
        </View>
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => (
            <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
              <ItemCardSkeleton />
            </View>
          )}
          keyExtractor={(_, index) => `${title}-skeleton-${index}`}
        />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={recommendationStyles.section}>
      <View style={recommendationStyles.sectionHeader}>
        <View style={[recommendationStyles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[recommendationStyles.sectionTitle, { color: colors.text.gray }]}>
          {title}
        </Text>
      </View>
      <FlatList
        horizontal
        data={products}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
            <ItemCard
              item={item}
              handleSheetChanges={() => {}}
              handlePresentModalPress={() => navigateToProduct(item._id, item)}
            />
          </View>
        )}
        keyExtractor={(item, index) => `${title}-${item._id}-${index}`}
      />
    </View>
  );
});

const recommendationStyles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

RecommendationSection.displayName = 'RecommendationSection';

/* ───────────────────────────── Main Component ───────────────────────────── */

export default function Details() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { details, name, price, image } = useLocalSearchParams();
  const productId = details ? String(details) : '';
  
  // Direct product fetching instead of store
  const { product, isLoading, error } = useProductFetch(productId);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  // For flexible attributes system
  const [selectedAttributesState, setSelectedAttributesState] = useState<SelectedAttributes>({});
  
  // Build selected attributes object for cart (merge legacy size/color with new attributes)
  const selectedAttributes = useMemo<SelectedAttributes>(() => {
    const attrs: SelectedAttributes = { ...selectedAttributesState };
    // Legacy support: add size and color if selected
    if (selectedSize) attrs.size = selectedSize;
    if (selectedColor) attrs.color = selectedColor;
    return attrs;
  }, [selectedSize, selectedColor, selectedAttributesState]);
  
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
  // price = original price, discountPrice = final selling price
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();
  
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

  // Use product directly or fallback to optimistic data
  const viewProduct = useMemo(() => {
    if (product) {
      // Return product with default values for missing fields
      return {
        _id: product._id,
        name: product.name || '',
        price: product.price || 0,
        discountPrice: product.discountPrice,
        images: product.images || [],
        stock: product.stock || 0,
        sizes: product.sizes || [],
        colors: (product as any).colors || [],
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
      };
    }
    
    return null;
  }, [product, productId, name, price, image]);
  
  // Get colors from product if available
  const availableColors = useMemo(() => {
    if (viewProduct?.colors && Array.isArray(viewProduct.colors) && viewProduct.colors.length > 0) {
      return viewProduct.colors;
    }
    return []; // Return empty array if no colors
  }, [viewProduct?.colors]);
  
  const inWishlist = useMemo(() => {
    return viewProduct?._id ? isInWishlist(viewProduct._id) : false;
  }, [viewProduct?._id, isInWishlist]);

  useEffect(() => {
    if (typeof image === 'string' && image) {
      RNImage.prefetch(image).catch(() => {});
    }
    // Prefetch next 1-2 images after first render if product exists
    const timeout = setTimeout(() => {
      try {
        const rest = viewProduct?.images?.slice(1, 3) || [];
        rest.forEach((uri: string) => {
          if (uri) RNImage.prefetch(uri).catch(() => {});
        });
      } catch {}
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
    return formatPriceUtil(currentPrice, 'SDG');
  }, [currentPrice]);
  
  const formattedOriginalPrice = useMemo(() => {
    if (!originalPrice || !productHasDiscount) return '';
    return formatPriceUtil(originalPrice, 'SDG');
  }, [originalPrice, productHasDiscount]);


  // Defer initial size selection to avoid blocking interaction
  useEffect(() => {
    if (viewProduct?.sizes && viewProduct.sizes.length > 0) {
      const task = InteractionManager.runAfterInteractions(() => {
        setSelectedSize(viewProduct.sizes[0] || null);
      });
      return () => task.cancel();
    }
    return undefined;
  }, [viewProduct?.sizes]);
  
  // Initialize attribute selections for variant-based products
  useEffect(() => {
    if (productAttributes && productAttributes.length > 0) {
      const initialAttrs: SelectedAttributes = {};
      productAttributes.forEach(attr => {
        if (attr.type === 'select' && attr.options && attr.options.length > 0) {
          // Auto-select first option for required attributes
          if (attr.required) {
            initialAttrs[attr.name] = attr.options[0];
          }
        }
      });
      setSelectedAttributesState(initialAttrs);
    }
  }, [productAttributes]);
  
  // Set initial color selection only if colors are available
  useEffect(() => {
    if (availableColors && availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    } else if (!availableColors || availableColors.length === 0) {
      // Clear selection if no colors available
      setSelectedColor(null);
    }
  }, [availableColors, selectedColor]);
  
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

  // Optimize viewable items callback
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }, []);

  // Memoize viewability config
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50
  }), []);

  // Optimize image modal handlers
  const openImageModal = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  // Optimize size selection
  const onSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    // Also update attributes state for variant-based products
    setSelectedAttributesState(prev => ({ ...prev, size }));
  }, []);


  // Memoized components
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const renderImageItem = useCallback(({ item: uri, index }: { item: string; index: number }) => {
    const showOverlay = index === 0 && !firstImageLoaded;
    return (
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={() => openImageModal(uri)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri }}
          alt="صورة المنتج"
          contentFit="contain"
          style={styles.productImage}
          cachePolicy="memory-disk"
          priority="high"
          onLoad={() => {
            if (index === 0) setFirstImageLoaded(true);
          }}
        />
        {showOverlay && (
          <View style={styles.imageLoaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#f0b745" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [openImageModal, firstImageLoaded]);

  const renderPagination = useCallback(() => {
    if (!viewProduct?.images || viewProduct.images.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {viewProduct.images.map((_ : any, index: number) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: Colors.text.white },
              index === currentImageIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    );
  }, [viewProduct?.images, currentImageIndex]);

  const renderSizeSelector = useCallback(() => {
    if (!viewProduct?.sizes || viewProduct.sizes.length === 0) return null;
    
    return (
      <View style={[styles.sizesContainer, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>{i18n.t('chooseSize') || 'Size'}</Text>
        <View style={[styles.sizesRow, I18nManager.isRTL && styles.sizesRowRTL]}>
          {viewProduct.sizes.map((size: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.sizeBox,
                { 
                  backgroundColor: Colors.cardBackground,
                  borderColor: Colors.borderLight,
                },
                size === selectedSize && {
                  backgroundColor: Colors.primary,
                  borderColor: Colors.primary,
                },
              ]}
              onPress={() => onSizeSelect(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  { color: Colors.text.gray },
                  size === selectedSize && { color: Colors.text.white },
                ]}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }, [viewProduct?.sizes, selectedSize, onSizeSelect]);
  
  const renderColorSelector = useCallback(() => {
    // Don't show color selector if no colors available
    if (!availableColors || availableColors.length === 0) {
      return null;
    }
    
    return (
      <View style={[styles.colorsContainer, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>{i18n.t('color') || 'Color'}</Text>
        <View style={[styles.colorsRow, I18nManager.isRTL && styles.colorsRowRTL]}>
          {availableColors.map((color: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.colorSwatch,
                { borderColor: 'transparent' },
                color === selectedColor && { borderColor: Colors.text.gray },
              ]}
              onPress={() => {
                setSelectedColor(color);
                // Also update attributes state
                setSelectedAttributesState(prev => ({ ...prev, color }));
              }}
            >
              <View style={[styles.colorCircle, { backgroundColor: color, borderColor: Colors.borderLight }]} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }, [availableColors, selectedColor, Colors]);
  
  // Render flexible attributes selector for variant-based products
  const renderAttributesSelector = useCallback(() => {
    if (!productAttributes || productAttributes.length === 0) {
      return null;
    }
    
    return (
      <>
        {productAttributes.map((attr: ProductAttribute) => {
          // Skip if it's size or color (handled separately for legacy support)
          if (attr.name === 'size' || attr.name === 'color') {
            return null;
          }
          
          if (attr.type === 'select' && attr.options && attr.options.length > 0) {
            return (
              <View key={attr.name} style={[styles.attributesContainer, { backgroundColor: Colors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>
                  {attr.displayName || attr.name} {attr.required && '*'}
                </Text>
                <View style={[styles.sizesRow, I18nManager.isRTL && styles.sizesRowRTL]}>
                  {attr.options.map((option: string, index: number) => {
                    const isSelected = selectedAttributesState[attr.name] === option;
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.sizeBox,
                          { 
                            backgroundColor: Colors.cardBackground,
                            borderColor: Colors.borderLight,
                          },
                          isSelected && {
                            backgroundColor: Colors.primary,
                            borderColor: Colors.primary,
                          },
                        ]}
                        onPress={() => {
                          setSelectedAttributesState(prev => ({ ...prev, [attr.name]: option }));
                        }}
                      >
                        <Text
                          style={[
                            styles.sizeText,
                            { color: Colors.text.gray },
                            isSelected && { color: Colors.text.white },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          }
          
          return null;
        })}
      </>
    );
  }, [productAttributes, selectedAttributesState, Colors]);


  // Show loading state while fetching product
  if (isLoading && !viewProduct) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.text.veryLightGray }]}>{i18n.t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  // Show error state if fetch failed and no fallback data
  if (error && !viewProduct) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.surface }]}>
        <Text style={[styles.errorText, { color: Colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('errorLoadingProduct') || 'Error loading product'}
        </Text>
        <Text style={[styles.errorSubText, { color: Colors.text.veryLightGray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{error}</Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: Colors.accent }]}
          onPress={() => router.replace("/(screens)")}
        >
          <Text style={[styles.backButtonText, { color: Colors.text.white }]}>{i18n.t('backToHome') || 'Back to Home'}</Text>
        </Pressable>
      </View>
    );
  }

  // Early return for no product at all (no params either)
  if (!viewProduct || !viewProduct._id) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.surface }]}>
        <Text style={[styles.errorText, { color: Colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('noProductAvailable') || 'No product available'}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: Colors.accent }]}
          onPress={() => router.replace("/(screens)")}
        >
          <Text style={[styles.backButtonText, { color: Colors.text.white }]}>{i18n.t('backToHome') || 'Back to Home'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.surface }, I18nManager.isRTL && styles.headerRTL]}>
        <Text style={[styles.brandName, { color: Colors.text.gray }]}>Nubian</Text>
        <TouchableOpacity 
          style={styles.cartIconButton}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <Ionicons name="bag-outline" size={24} color={Colors.text.gray} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true}
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <FlatList
              data={viewProduct.images}
              keyExtractor={(item, index) => {
                // Create a unique, stable key that handles duplicate URLs
                // For product images, the list is static (from product data, doesn't reorder)
                // So using index is safe and ensures uniqueness even with duplicate URLs
                // Format: "url-index" ensures both uniqueness and stability for static lists
                const url = item || `image-${index}`;
                return `${url}-${index}`;
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderImageItem}
              ref={flatListRef}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              pagingEnabled
              initialNumToRender={1}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
            
            {showDeferred ? renderPagination() : null}
          </View>
        </View>

        {/* Product Details */}
        <View style={[styles.productDetails, { backgroundColor: Colors.surface }]}>
          {/* Product Name and Price */}
          <View style={[styles.productInfoCard, { backgroundColor: Colors.cardBackground }]}>
            <Text style={[styles.productName, { color: Colors.text.gray }]}>{viewProduct.name}</Text>
            <View style={styles.priceContainer}>
              {productHasDiscount && (
                <Text style={[styles.originalPrice, { color: Colors.text.veryLightGray }]}>
                  {formattedOriginalPrice}
                </Text>
              )}
              <Text style={[styles.price, { color: Colors.text.gray }]}>{formattedFinalPrice}</Text>
            </View>
          </View>

          {/* Description */}
          {viewProduct.description && (
            <View style={[styles.descriptionSection, { backgroundColor: Colors.cardBackground }]}>
              <Text style={[styles.descriptionTitle, { color: Colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {i18n.t('description') || 'Description'}
              </Text>
              <Text style={[styles.description, { color: Colors.text.veryLightGray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {viewProduct.description}
              </Text>
            </View>
          )}

          {/* Size Selector (legacy support) */}
          {renderSizeSelector()}

          {/* Color Selector (legacy support) */}
          {renderColorSelector()}
          
          {/* Flexible Attributes Selector (for variant-based products) */}
          {renderAttributesSelector()}
          
          {/* Stock Display */}
          {viewProduct && (
            <View style={[styles.stockContainer, { backgroundColor: Colors.cardBackground }]}>
              <Text style={[styles.stockText, { color: Colors.text.gray }]}>
                {i18n.t('stock') || 'Stock'}: {currentStock > 0 ? (
                  <Text style={{ color: Colors.primary, fontWeight: '600' }}>{currentStock}</Text>
                ) : (
                  <Text style={{ color: '#ff4444', fontWeight: '600' }}>{i18n.t('outOfStock') || 'Out of Stock'}</Text>
                )}
              </Text>
            </View>
          )}

          {/* Review Section (deferred) */}
          {showDeferred ? <Review productId={viewProduct._id} /> : null}

          {/* Recommendation Sections */}
          {showDeferred && recommendations && (
            <>
              {/* Similar Items */}
              {recommendations.similarItems && recommendations.similarItems.length > 0 && (
                <RecommendationSection
                  title={i18n.t('similarItems') || 'Similar Items'}
                  products={recommendations.similarItems}
                  colors={Colors}
                  isLoading={isLoadingRecommendations}
                  router={router}
                />
              )}

              {/* Frequently Bought Together */}
              {recommendations.frequentlyBoughtTogether && recommendations.frequentlyBoughtTogether.length > 0 && (
                <RecommendationSection
                  title={i18n.t('frequentlyBoughtTogether') || 'Frequently Bought Together'}
                  products={recommendations.frequentlyBoughtTogether}
                  colors={Colors}
                  isLoading={isLoadingRecommendations}
                  router={router}
                />
              )}

              {/* You May Also Like */}
              {recommendations.youMayAlsoLike && recommendations.youMayAlsoLike.length > 0 && (
                <RecommendationSection
                  title={i18n.t('youMayAlsoLike') || 'You May Also Like'}
                  products={recommendations.youMayAlsoLike}
                  colors={Colors}
                  isLoading={isLoadingRecommendations}
                  router={router}
                />
              )}

              {/* Cheaper Alternatives */}
              {recommendations.cheaperAlternatives && recommendations.cheaperAlternatives.length > 0 && (
                <RecommendationSection
                  title={i18n.t('cheaperAlternatives') || 'Cheaper Alternatives'}
                  products={recommendations.cheaperAlternatives}
                  colors={Colors}
                  isLoading={isLoadingRecommendations}
                  router={router}
                />
              )}

              {/* From the Same Store */}
              {recommendations.fromSameStore && recommendations.fromSameStore.length > 0 && (
                <RecommendationSection
                  title={i18n.t('fromSameStore') || 'From the Same Store'}
                  products={recommendations.fromSameStore}
                  colors={Colors}
                  isLoading={isLoadingRecommendations}
                  router={router}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={[
        styles.bottomContainer, 
        { 
          paddingBottom: Math.max(insets.bottom, 20),
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
        }
      ]}>
        <View style={[styles.actionButtonsRow, I18nManager.isRTL && styles.actionButtonsRowRTL]}>
          <View style={styles.addToCartButtonWrapper}>
            <AddToCartButton
              product={viewProduct}
              selectedSize={selectedSize ?? ""}
              selectedAttributes={selectedAttributes}
              buttonStyle={[
                styles.addToCartButton,
                !isAvailable && styles.disabledButton,
              ]}
              disabled={!isAvailable}
            />
          </View>
          <Pressable
            style={[styles.wishlistButton, wishlistLoading && styles.wishlistButtonDisabled]}
            onPress={handleWishlistPress}
            disabled={wishlistLoading}
          >
            {wishlistLoading ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <Text style={styles.wishlistButtonText}>{i18n.t('wishlist') || 'Wishlist'}</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
        animationType="fade" // Faster animation
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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '600',
  },
  cartIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // Image Section
  imageSection: {
    position: 'relative',
  },
  imageContainer: {
    height: imageHeight,
    position: 'relative',
  },
  imageWrapper: {
    width: screenWidth,
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  imageLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)'
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
  },
  
  // Product Details
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
  
  // Description
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  expandButton: {
    marginTop: 8,
  },
  expandButtonText: {
    color: "#30a1a7",
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Size Selector
  sizesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sizesRowRTL: {
    flexDirection: 'row-reverse',
  },
  sizeBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
  },
  selectedSizeBox: {
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedSizeText: {
  },
  
  // Color Selector
  colorsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  colorsRowRTL: {
    flexDirection: 'row-reverse',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  selectedColorSwatch: {
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  
  // Attributes Container
  attributesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  
  // Stock Display
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
  
  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonsRowRTL: {
    flexDirection: 'row-reverse',
  },
  addToCartButtonWrapper: {
    flex: 1,
  },
  addToCartButton: {
    borderRadius: 8,
    paddingVertical: 10,
  },
  disabledButton: {
  },
  wishlistButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 100,
  },
  wishlistButtonDisabled: {
    opacity: 0.6,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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