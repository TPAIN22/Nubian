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
} from "react-native";
import { Text } from "@/components/ui/text";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const { width: screenWidth } = Dimensions.get("window");

// Pre-calculate styles outside component to avoid recreation
const imageHeight = screenWidth * 1.1;

export default function Details() {
  const { details, name, price, image } = useLocalSearchParams();
  const productId = details ? String(details) : '';
  
  // Direct product fetching instead of store
  const { product, isLoading, error } = useProductFetch(productId);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();

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

  const formattedPrice = useMemo(() => {
    if (!viewProduct?.price) return '';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(viewProduct.price).replace('$', '$ ');
  }, [viewProduct?.price]);


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
      <View style={styles.sizesContainer}>
        <Text style={styles.sectionTitle}>{i18n.t('chooseSize') || 'Size'}</Text>
        <View style={[styles.sizesRow, I18nManager.isRTL && styles.sizesRowRTL]}>
          {viewProduct.sizes.map((size: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.sizeBox,
                size === selectedSize && styles.selectedSizeBox,
              ]}
              onPress={() => onSizeSelect(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  size === selectedSize && styles.selectedSizeText,
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
      <View style={styles.colorsContainer}>
        <Text style={styles.sectionTitle}>{i18n.t('color') || 'Color'}</Text>
        <View style={[styles.colorsRow, I18nManager.isRTL && styles.colorsRowRTL]}>
          {availableColors.map((color: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.colorSwatch,
                color === selectedColor && styles.selectedColorSwatch,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              <View style={[styles.colorCircle, { backgroundColor: color }]} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }, [availableColors, selectedColor]);


  // Show loading state while fetching product
  if (isLoading && !viewProduct) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f0b745" />
        <Text style={styles.loadingText}>{i18n.t('loading') || 'Loading...'}</Text>
      </View>
    );
  }

  // Show error state if fetch failed and no fallback data
  if (error && !viewProduct) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('errorLoadingProduct') || 'Error loading product'}
        </Text>
        <Text style={[styles.errorSubText, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{error}</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(screens)")}
        >
          <Text style={styles.backButtonText}>{i18n.t('backToHome') || 'Back to Home'}</Text>
        </Pressable>
      </View>
    );
  }

  // Early return for no product at all (no params either)
  if (!viewProduct || !viewProduct._id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
          {i18n.t('noProductAvailable') || 'No product available'}
        </Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(screens)")}
        >
          <Text style={styles.backButtonText}>{i18n.t('backToHome') || 'Back to Home'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, I18nManager.isRTL && styles.headerRTL]}>
        <Text style={styles.brandName}>Noubian</Text>
        <TouchableOpacity 
          style={styles.cartIconButton}
          onPress={() => router.push("/(tabs)/cart")}
        >
          <Ionicons name="bag-outline" size={24} color={Colors.text.secondary} />
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
              keyExtractor={(item) => item}
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
        <View style={styles.productDetails}>
          {/* Product Name and Price */}
          <View style={styles.productInfoCard}>
            <Text style={styles.productName}>{viewProduct.name}</Text>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>

          {/* Description */}
          {viewProduct.description && (
            <View style={styles.descriptionSection}>
              <Text style={[styles.descriptionTitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {i18n.t('description') || 'Description'}
              </Text>
              <Text style={[styles.description, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
                {viewProduct.description}
              </Text>
            </View>
          )}

          {/* Size Selector */}
          {renderSizeSelector()}

          {/* Color Selector */}
          {renderColorSelector()}

          {/* Review Section (deferred) */}
          {showDeferred ? <Review productId={viewProduct._id} /> : null}
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={[styles.actionButtonsRow, I18nManager.isRTL && styles.actionButtonsRowRTL]}>
          <View style={styles.addToCartButtonWrapper}>
            <AddToCartButton
              product={viewProduct}
              selectedSize={selectedSize ?? ""}
              buttonStyle={[
                styles.addToCartButton,
                viewProduct.stock === 0 && styles.disabledButton,
              ]}
              disabled={viewProduct.stock === 0}
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: '#FFFFFF',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.secondary,
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
    color: "#666",
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
    color: "#666",
    marginBottom: 8,
  },
  errorSubText: {
    textAlign: "center",
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#30a1a7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  backButtonText: {
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
  },
  
  // Product Details
  productDetails: {
    paddingBottom: 120,
    backgroundColor: '#FFFFFF',
  },
  productInfoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 32,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  
  // Description
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#666",
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
  },
  selectedSizeBox: {
    backgroundColor: "#a37e2c",
    borderColor: "#a37e2c",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  selectedSizeText: {
    color: "#FFFFFF",
  },
  
  // Color Selector
  colorsContainer: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#000000',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
    backgroundColor: "#a37e2c",
    borderRadius: 8,
    paddingVertical: 10,
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  wishlistButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
  },
  wishlistButtonDisabled: {
    opacity: 0.6,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
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