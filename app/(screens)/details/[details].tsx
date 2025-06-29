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
  I18nManager,
  FlatList,
} from "react-native";
import  { useState, useEffect, useRef } from "react";
import AddToCartButton from "../../components/AddToCartButton";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Review from "../../components/Review";
import i18n from "@/utils/i18n";

const { width: screenWidth } = Dimensions.get("window");

export default function Details() {
  const { product } = useItemStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const router = useRouter();

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }

    // Debug: طباعة معلومات المنتج

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [product]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const renderPagination = () => {
    if (!product.images || product.images.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {product.images.map((image: string, index: number) => (
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
  };

  if (!product) {
    const router = useRouter();
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لا يوجد منتج للعرض</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            router.replace("/(screens)");
          }}
        >
          <Text style={styles.backButtonText}>العودة للرئيسية</Text>
        </Pressable>
      </View>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SD", {
      style: "currency",
      currency: "SDG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderSizeSelector = () => (
    <View style={styles.sizesContainer}>
      <Text style={styles.sectionTitle}>{i18n.t('availableSizes')}:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sizesScrollContainer}
      >
        {product.sizes.map((size: string, index: number) => (
          <Pressable
            key={index}
            style={[
              styles.sizeBox,
              size === selectedSize && styles.selectedSizeBox,
            ]}
            onPress={() => setSelectedSize(size)}
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
      </ScrollView>
    </View>
  );

  const renderPriceSection = () => (
    <View style={styles.priceSection}>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        {product.discountPrice > 0 && (
          <View style={styles.discountContainer}>
            <Text style={styles.originalPrice}>
              {formatPrice(product.discountPrice)}
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>خصم</Text>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.stockIndicator}>
        <View
          style={[
            styles.stockDot,
            { backgroundColor: product.stock > 0 ? "#4CAF50" : "#F44336" },
          ]}
        />
        <Text
          style={[
            styles.stockText,
            { color: product.stock > 0 ? "#4CAF50" : "#F44336" },
          ]}
        >
          {product.stock > 0 ? "متوفر في المخزن" : "غير متوفر"}
        </Text>
      </View>
    </View>
  );

  const renderDescription = () => {
    // Split description into an array of lines. Handle potential undefined/null cases.
    const descriptionLines = product.description?.split('\\n') || [];

    // Determine which lines to show based on the "expanded" state.
    // Shows the first 3 lines if not expanded, or all lines if expanded.
    const displayedLines = isDescriptionExpanded ? descriptionLines : descriptionLines.slice(0, 3);

    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>الوصف:</Text>
        
        {/* Map over the lines to be displayed and render each in its own Text component */}
        {displayedLines.map((line:any, index:any) => (
          <Text key={index} style={styles.description}>
            {line}
          </Text>
        ))}

        {/* Show the "Read more/less" button only if there are more than 3 lines */}
        {descriptionLines.length > 3 && (
          <Pressable
            style={styles.expandButton}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Text style={styles.expandButtonText}>
              {isDescriptionExpanded ? "اقرأ أقل" : "اقرأ المزيد"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            <FlatList
              data={product.images}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageScrollContent}
              renderItem={({ item: uri }) => (
                <TouchableOpacity
                  style={styles.imageWrapper}
                  onPress={() => {
                    setSelectedImage(uri);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri }}
                    alt={`صورة المنتج`}
                    contentFit="contain"
                    style={styles.productImage}
                  />
                </TouchableOpacity>
              )}
              ref={flatListRef}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              pagingEnabled
            />
            {renderPagination()}
          </View>

          {/* Gradient overlay for better text readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.1)"]}
            style={styles.imageGradient}
          />
        </View>

        {/* Product Details */}
        <Animated.View
          style={[
            styles.productDetails,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price Section */}
          {renderPriceSection()}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && renderSizeSelector()}

          {/* Description */}
          {product.description && renderDescription()}

          {/* Features/Specifications */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>{i18n.t('features')}:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚚</Text>
                <Text style={styles.featureText}>{i18n.t('freeShipping')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>↩️</Text>
                <Text style={styles.featureText}>{i18n.t('replacement')}</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>{i18n.t('qualityWarranty')}</Text>
              </View>
            </View>
          </View>

          {/* ضع الريفيو هنا في نهاية ScrollView */}
          <Review productId={product._id} />
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "#ffffff"]}
          style={styles.bottomGradient}
        />
        <View style={styles.buttonContainer}>
          <AddToCartButton
            product={product}
            selectedSize={selectedSize ?? ""}
            title={i18n.t('addToCart')}
            buttonStyle={[
              styles.addToCartButton,
              product.stock === 0 && styles.disabledButton,
            ].filter(Boolean)}
            disabled={product.stock === 0}
          />
        </View>
      </View>
      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 2 }}
            onPress={() => setModalVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 30 }}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: '90%', height: '70%', borderRadius: 12 }}
              contentFit="contain"
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
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  heroSection: {
    backgroundColor: "#ffffff",
    minHeight: 300,
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: "center",
  },
  imageWrapper: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    minHeight: 300,
  },
  productImage: {
    width: screenWidth - 32,
    height: 400, // Fixed reasonable height
    borderRadius: 8,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  pagination: {
    bottom: 20,
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.5)",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 4,
    marginRight: 4,
  },
  activeDot: {
    backgroundColor: "#30a1a7",
    width: 24,
    height: 10,
    borderRadius: 5,
    marginLeft: 4,
    marginRight: 4,
  },
  productDetails: {
    padding: 24,
    paddingBottom: 100,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  priceSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    color: "#30a1a7",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stockIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sizesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  sizesScrollContainer: {
    paddingRight: 16,
  },
  sizeBox: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: "#e9ecef",
    minWidth: 50,
    alignItems: "center",
  },
  selectedSizeBox: {
    backgroundColor: "#30a1a7",
    borderColor: "#30a1a7",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  selectedSizeText: {
    color: "#FFFFFF",
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  expandButton: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  expandButtonText: {
    color: "#30a1a7",
    fontSize: 14,
    fontWeight: "600",
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
    textAlign: "right",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    height: 30,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
  },
  addToCartButton: {
    backgroundColor: "#30a1a7",
    borderRadius: 16,
    paddingVertical: 16,
    width: "100%",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  imageContainer: {
    height: screenWidth,
    backgroundColor: "#f8f9fa",
  },
  swiper: {
    height: screenWidth,
  },
});