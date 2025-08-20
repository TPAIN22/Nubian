import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AddToCartButton from "../../components/AddToCartButton";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Review from "../../components/Review";
import i18n from "@/utils/i18n";

const { width: screenWidth } = Dimensions.get("window");

// Pre-calculate styles outside component to avoid recreation
const imageHeight = screenWidth * 1.1;

export default function Details() {
  const { product } = useItemStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Use refs for animations without triggering re-renders
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible
  const slideAnim = useRef(new Animated.Value(0)).current; // Start in position
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Memoize expensive calculations
  const formattedPrice = useMemo(() => {
    if (!product?.price) return '';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(product.price).replace('$', '$ ');
  }, [product?.price]);

  const formattedDiscountPrice = useMemo(() => {
    if (!product?.discountPrice || product.discountPrice <= 0) return '';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", 
      minimumFractionDigits: 0,
    }).format(product.discountPrice).replace('$', '$ ');
  }, [product?.discountPrice]);

  const descriptionLines = useMemo(() => {
    return product?.description?.split('\\n') || [];
  }, [product?.description]);

  // Set initial size without animation delay
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product?.sizes]);

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

  // Optimize description toggle
  const toggleDescription = useCallback(() => {
    setIsDescriptionExpanded(prev => !prev);
  }, []);

  // Memoized components
  const renderImageItem = useCallback(({ item: uri }: { item: string }) => (
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
        cachePolicy="memory-disk" // Optimize caching
        priority="high" // High priority loading
      />
    </TouchableOpacity>
  ), [openImageModal]);

  const renderPagination = useCallback(() => {
    if (!product?.images || product.images.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {product.images.map((_ : any, index: number) => (
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
  }, [product?.images, currentImageIndex]);

  const renderSizeSelector = useCallback(() => {
    if (!product?.sizes || product.sizes.length === 0) return null;
    
    return (
      <View style={styles.sizesContainer}>
        <Text style={styles.sectionTitle}>{i18n.t('chooseSize') || 'Choose size'}</Text>
        <View style={styles.sizesRow}>
          {product.sizes.map((size: string, index: number) => (
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
  }, [product?.sizes, selectedSize, onSizeSelect]);

  const renderDescription = useCallback(() => {
    if (!product?.description) return null;
    
    const displayedLines = isDescriptionExpanded 
      ? descriptionLines 
      : descriptionLines.slice(0, 3);

    return (
      <View style={styles.descriptionContainer}>
        {displayedLines.map((line: string, index: number) => (
          <Text key={index} style={styles.description}>
            {line}
          </Text>
        ))}
        
        {descriptionLines.length > 3 && (
          <Pressable
            style={styles.expandButton}
            onPress={toggleDescription}
          >
            <Text style={styles.expandButtonText}>
              {isDescriptionExpanded ? "Show less" : "Read more"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }, [product?.description, isDescriptionExpanded, descriptionLines, toggleDescription]);

  // Early return for no product
  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لا يوجد منتج للعرض</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(screens)")}
        >
          <Text style={styles.backButtonText}>العودة للرئيسية</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
        removeClippedSubviews={true} // Optimize performance
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <FlatList
              data={product.images}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderImageItem}
              ref={flatListRef}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              pagingEnabled
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })} // Optimize FlatList performance
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              windowSize={5}
            />
            
            {/* Favorite Icon */}
            <TouchableOpacity style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>♡</Text>
            </TouchableOpacity>
            
            {renderPagination()}
          </View>
        </View>

        {/* Product Details - Remove animation wrapper */}
        <View style={styles.productDetails}>
          {/* Product Info Card */}
          <View style={styles.productInfoCard}>
            <Text style={styles.productName}>{product.name}</Text>    
            {renderDescription()}
          </View>

          {/* Size Selector */}
          {renderSizeSelector()}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formattedPrice}</Text>
              {formattedDiscountPrice && (
                <Text style={styles.originalPrice}>
                  {formattedDiscountPrice}
                </Text>
              )}
            </View>
          </View>

          {/* Review Section */}
          <Review productId={product._id} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <AddToCartButton
          product={product}
          selectedSize={selectedSize ?? ""}
          title={i18n.t('addToCart') || 'Add to Cart'}
          buttonStyle={[
            styles.addToCartButton,
            product.stock === 0 && styles.disabledButton,
          ].filter(Boolean)}
          disabled={product.stock === 0}
        />
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

// StyleSheet.create outside component to avoid recreation
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: "#f8f9fa",
    position: 'relative',
  },
  imageContainer: {
    height: imageHeight, // Pre-calculated
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
    borderRadius: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#666',
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
    backgroundColor: "rgba(0,0,0,0.3)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#30a1a7",
    width: 20,
    height: 8,
  },
  
  // Product Details
  productDetails: {
    paddingBottom: 100,
  },
  productInfoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 28,
  },
  
  // Description
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#1a1a1a",
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sizeBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 50,
    alignItems: "center",
  },
  selectedSizeBox: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  sizeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  selectedSizeText: {
    color: "#FFFFFF",
  },
  
  // Price Section
  priceSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  originalPrice: {
    fontSize: 16,
    color: "#999",
    textDecorationLine: "line-through",
  },
  
  // Bottom Container
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  addToCartButton: {
    backgroundColor: "#f0b745",
    borderRadius: 4,
    width: "100%",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
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