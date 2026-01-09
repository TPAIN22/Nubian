import { View, Dimensions, StyleSheet, Pressable, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import React, { useState, useEffect, useMemo } from "react"; 
import { ScrollView } from "react-native-gesture-handler";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import AddToCartButton from "./AddToCartButton";
import type { SelectedAttributes } from "@/types/cart.types";
import { mergeSizeAndAttributes } from "@/utils/cartUtils";
import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice as formatPriceUtil } from "@/utils/priceUtils";

const { width: windowWidth } = Dimensions.get("window");

const BottomSheet = () => {
  const { product } = useItemStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null); 

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  // Get prices using centralized utility
  const originalPrice = getOriginalPrice(product);
  const finalPrice = getFinalPrice(product);
  const productHasDiscount = hasDiscount(product);
  
  // Build selected attributes for cart
  const selectedAttributes = useMemo<SelectedAttributes>(() => {
    return mergeSizeAndAttributes(selectedSize, {});
  }, [selectedSize]);

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          contentContainerStyle={styles.imageSliderContainer}
        >
          {product.images?.length > 0 ? (
            product.images.map((image: string, index: number) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: image }}
                  style={styles.productImage}
                  contentFit="cover"
                />
              </View>
            ))
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.detailsContainer}>
          <Text style={styles.productName}>{product.name}</Text>

          {product.sizes?.length > 0 && (
            <View style={styles.sizesContainer}>
              <Text style={styles.sectionTitle}>Sizes:</Text>
              <View style={styles.sizesList}>
                {product.sizes.map((size: string, index: number) => (
                  <Pressable
                    key={index} 
                    onPress={() => {
                      setSelectedSize(size); 
                    }}
                    style={[
                      styles.sizeBox, 
                      { backgroundColor: size === selectedSize ? '#30a1a7' : '#fff' }, 
                      
                      size !== selectedSize && { borderColor: '#ccc' }
                    ]}
                  >
                    <Text
                      
                      style={[
                        styles.sizeText, 
                        { color: size === selectedSize ? '#fff' : '#666' } 
                      ]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Price Display */}
          {/* price = original price, discountPrice = final selling price */}
          <View style={styles.priceContainer}>
            {productHasDiscount ? (
              <>
                {/* Final price (after discount) */}
                <Text style={styles.discountPrice}>
                  {formatPriceUtil(finalPrice)}
                </Text>
                {/* Original price (strikethrough) */}
                <Text style={styles.originalPrice}>
                  {formatPriceUtil(originalPrice)}
                </Text>
              </>
            ) : (
              <Text style={styles.productPrice}>{formatPriceUtil(finalPrice)}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.buttonContainer}>
        <AddToCartButton 
          product={product} 
          selectedSize={selectedSize??""} 
          selectedAttributes={selectedAttributes}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#888",
  },
  imageSliderContainer: {
    alignItems: "center",
  },
  imageWrapper: {
    width: windowWidth,
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: windowWidth,
    height: 300,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#888",
    fontSize: 16,
  },
  detailsContainer: {
    padding: 20,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "left",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
    textAlign: "left",
  },
  sizesContainer: {
    marginBottom: 10,
    
  },
  sizesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "flex-end", 
  },
  sizeBox: { 
    fontSize: 16, 
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    
    justifyContent: 'center', 
    alignItems: 'center',    
  },
  sizeText: { 
    fontSize: 16,
    color: "#666", 
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
    
    alignSelf: "flex-end", 
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f0b745",
    textAlign: "left",
  },
  discountPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f0b745",
    textAlign: "left",
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: "#888",
    textDecorationLine: "line-through",
    textAlign: "left",
  },
  descriptionContainer: {
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "left",
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
});

export default BottomSheet;