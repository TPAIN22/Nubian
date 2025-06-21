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
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import AddToCartButton from "../../components/AddToCartButton";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import Swiper from "react-native-swiper";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get("window");

export default function Details() {
  const { product } = useItemStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }

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
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderSizeSelector = () => (
    <View style={styles.sizesContainer}>
      <Text style={styles.sectionTitle}>المقاسات المتاحة:</Text>
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

  const renderDescription = () => (
    <View style={styles.descriptionContainer}>
      <Text style={styles.sectionTitle}>الوصف:</Text>
      <Text
        numberOfLines={isDescriptionExpanded ? undefined : 3}
        style={styles.description}
      >
        {product.description}
      </Text>
      {product.description && product.description.length > 150 && (
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
            <Swiper
              loop={false}
              showsPagination={true}
              paginationStyle={styles.pagination}
              dotStyle={styles.dot}
              activeDotStyle={styles.activeDot}
              style={styles.swiper}
            >
              {product.images?.map((uri: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageWrapper}
                  onPress={() => {
                    setSelectedImage(uri);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri }}
                    alt={`صورة المنتج ${index + 1}`}
                    contentFit="contain"
                    style={styles.productImage}
                  />
                </TouchableOpacity>
              ))}
            </Swiper>
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
            <Text style={styles.sectionTitle}>المميزات:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚚</Text>
                <Text style={styles.featureText}>شحن مجاني للطلبات فوق 50,000,00 جنيه</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>↩️</Text>
                <Text style={styles.featureText}>إمكانية الاستبدال خلال 3 ايام</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>ضمان الجودة</Text>
              </View>
            </View>
          </View>
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
            title="إضافة إلى السلة"
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
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    textAlign: "right",
    marginBottom: 16,
    lineHeight: 36,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "right",
    marginBottom: 12,
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
    lineHeight: 26,
    color: "#495057",
    textAlign: "right",
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