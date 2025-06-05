import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image as RNImage, // Import from react-native for getSize
} from "react-native";
import { Image } from "expo-image"; // Expo Image for optimized loading
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { StatusBar } from "expo-status-bar";
import useItemStore from "@/store/useItemStore"; // تأكد من استيرادها بشكل صحيح
import AddToCartButton from "./components/AddToCartButton";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import GoogleSignInSheet from "./(auth)/signin";

const { width: screenWidth } = Dimensions.get("window");
const IMAGE_HORIZONTAL_MARGIN = 20;
const SLIDER_IMAGE_WIDTH = screenWidth - IMAGE_HORIZONTAL_MARGIN;
const DEFAULT_IMAGE_HEIGHT = 250;

const PLACEHOLDER_IMAGE_URI =
  "https://via.placeholder.com/400x250?text=No+Image";

export default function Details() {
  const { product, signInModelVisible, setSignInModelVisible } = useItemStore(); // <--- إضافة signInModelVisible و setSignInModelVisible
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [calculatedImageHeight, setCalculatedImageHeight] =
    useState(DEFAULT_IMAGE_HEIGHT);
  const headerHeight = useHeaderHeight();
  const router = useRouter();

  // Handle case where product might be null (e.g., direct navigation without product set)
  useEffect(() => {
    if (!product || !product._id) {
      router.back();
    }
  }, [product, router]);

  const productImages = useMemo(() => {
    if (product?.images?.length) {
      return product.images;
    }
    if (product?.image) {
      return [product.image];
    }
    return [PLACEHOLDER_IMAGE_URI];
  }, [product?.images, product?.image]);

  useEffect(() => {
    const uri = productImages[0];
    if (!uri || uri === PLACEHOLDER_IMAGE_URI) {
      setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
      return;
    }

    RNImage.getSize(
      uri,
      (imgWidth, imgHeight) => {
        if (imgWidth === 0) {
          setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
          return;
        }
        const aspectRatio = imgHeight / imgWidth;
        const newHeight = aspectRatio * SLIDER_IMAGE_WIDTH;
        setCalculatedImageHeight(Math.min(newHeight, 400));
      },
      (error) => {
        console.warn("Failed to get image size:", error);
        setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
      }
    );
  }, [productImages]);

  const handleSizeSelection = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleIncrementQuantity = useCallback(() => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  }, []);

  const handleDecrementQuantity = useCallback(() => {
    setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }, []);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    // يمكنك إضافة منطق هنا عند تغيير حالة الـ Bottom Sheet
    // مثلاً، إذا تم إغلاقه، يمكنك إعادة تعيين signInModelVisible إلى false
    if (index === -1) {
      setSignInModelVisible(false);
    }
  }, [setSignInModelVisible]); // <--- إضافة setSignInModelVisible إلى dependencies

  // NEW: useEffect to open BottomSheetModal when signInModelVisible changes
  useEffect(() => {
    if (signInModelVisible) {
      handlePresentModalPress();
    } else {
      bottomSheetModalRef.current?.dismiss(); // أغلق الـ modal إذا كانت signInModelVisible false
    }
  }, [signInModelVisible, handlePresentModalPress]);

  if (!product || !product.name) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل المنتج...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          title: "تفاصيل المنتج",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTransparent: false,
          headerStyle: {
            backgroundColor: "#F8F8F8",
          },
          headerTintColor: "#A37E2C",
          headerTitleStyle: styles.headerTitle,
          headerRight: () => (
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.headerIcon}
              accessibilityLabel="شعار المتجر"
            />
          ),
        }}
      />
      <GestureHandlerRootView style={styles.loadingContainer}>
        <BottomSheetModalProvider>
          <ScrollView style={styles.scrollViewContent}>
            {/* Image Slider */}
            <View style={styles.imageSliderContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: screenWidth }}
              >
                {productImages.map((imgUri: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: imgUri }}
                    style={[
                      styles.productImage,
                      { height: calculatedImageHeight },
                    ]}
                    contentFit="cover"
                    accessibilityLabel={`صورة المنتج ${index + 1} من ${
                      productImages.length
                    }`}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Product Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.productName} accessibilityRole="header">
                {product.name}
              </Text>

              {/* Quantity and Price */}
              <View style={styles.quantityPriceContainer}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    onPress={handleIncrementQuantity}
                    accessibilityLabel="زيادة الكمية"
                    accessibilityRole="button"
                  >
                    <Ionicons name="add-circle" size={38} color="#A37E2C" />
                  </TouchableOpacity>
                  <Text
                    style={styles.quantityText}
                    accessibilityLabel={`الكمية المختارة: ${quantity}`}
                  >
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={handleDecrementQuantity}
                    accessibilityLabel="تقليل الكمية"
                    accessibilityRole="button"
                  >
                    <Ionicons name="remove-circle" size={38} color="#000" />
                  </TouchableOpacity>
                </View>
                <Text
                  style={styles.productPrice}
                  accessibilityLabel={`سعر المنتج: ${product.price} جنيه سوداني`}
                >
                  {`SDG ${product.price}`}
                </Text>
              </View>

              {/* Size Selection */}
              {product.sizes?.length > 0 && (
                <View style={styles.sizeSelectionContainer}>
                  {product.sizes.map((size: string, index: number) => {
                    const isSelected = selectedSize === size;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleSizeSelection(size)}
                        style={[
                          styles.sizeOption,
                          isSelected && styles.selectedSize,
                        ]}
                        accessibilityLabel={`اختيار المقاس ${size}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <Text
                          style={[
                            styles.sizeText,
                            isSelected && styles.selectedSizeText,
                          ]}
                        >
                          {size}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Product Description */}
              {product.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>الوصف:</Text>
                  <Text
                    style={styles.descriptionText}
                    accessibilityLabel={`وصف المنتج: ${product.description}`}
                  >
                    {product.description}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Add to Cart Button */}
          <AddToCartButton
            product={{ ...product, size: selectedSize || undefined, quantity }}
            title="اضافة الى السلة"
            textStyle={styles.addToCartText}
            buttonStyle={styles.addToCartButton}
          />
          <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={["50%"]} 
            onChange={handleSheetChanges}
            enablePanDownToClose={true} // تسمح بسحب الشيت للأسفل لإغلاقه
            backdropComponent={({ style }) => ( // إضافة خلفية معتمة
              <View style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
            )}
          >
            <BottomSheetView style={styles.contentContainer}>
              <GoogleSignInSheet />
            </BottomSheetView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 18,
    color: "#A37E2C",
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#A37E2C",
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
    paddingBottom: 40,
  },
  headerIcon: {
    marginTop: 10,
    width: 40,
    height: 40,
  },
  imageSliderContainer: {
    alignItems: "center", // Center the slider content
  },
  productImage: {
    width: SLIDER_IMAGE_WIDTH, // Use calculated width
    marginHorizontal: IMAGE_HORIZONTAL_MARGIN / 2, // Half margin on each side
    borderRadius: 20,
  },
  detailsContainer: {
    gap: 20, // Reduced gap for tighter spacing
    paddingHorizontal: 20,
    paddingTop: 20, // Add some padding at the top of details section
  },
  productName: {
    fontSize: 30, // Slightly reduced font size
    fontWeight: "bold",
    textAlign: "right",
    color: "#2D3748", // Darker text for readability
  },
  quantityPriceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15, // Increased gap for better touch targets
  },
  quantityText: {
    fontSize: 18, // Slightly larger font size
    fontWeight: "600",
    color: "#30a1a7",
  },
  productPrice: {
    fontSize: 24, // Larger font size for price
    fontWeight: "bold",
    color: "#38A169", // Green for price
  },
  sizeSelectionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end", // Align sizes to the right
  },
  sizeOption: {
    paddingHorizontal: 16, // Increased padding
    paddingVertical: 10,
    borderRadius: 25, // More rounded corners
    borderWidth: 1,
    borderColor: "#E2E8F0", // Lighter border color
    backgroundColor: "#F7FAFC", // Light background
  },
  sizeText: {
    color: "#4A5568", // Darker gray text
    fontSize: 15,
    fontWeight: "500",
  },
  selectedSize: {
    borderColor: "#A37E2C", // Accent color border
    backgroundColor: "#A37E2C", // Accent color background
  },
  selectedSizeText: {
    color: "#FFFFFF", // White text for selected
  },
  descriptionContainer: {
    alignSelf: "flex-end", // Align text to the right
    marginTop: 10, // Add some top margin
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 5,
    textAlign: "right", // Align label to the right
  },
  descriptionText: {
    fontSize: 16,
    color: "#4A5568", // Slightly darker gray for description
    textAlign: "right", // Ensure description text is right-aligned
    lineHeight: 24, // Improve readability
  },
  bottomSpacer: {
    height: 20,
  },
  addToCartButton: {
    backgroundColor: "#A37E2C",
    borderRadius: 30, 
    width: "90%",
    alignSelf: "center",
    paddingVertical: 15, 
    position: "sticky", 
    bottom: 20,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 30,
    marginTop: 10,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});