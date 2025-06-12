import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import AddToCartButton from "./components/AddToCartButton";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import Swiper from "react-native-swiper";

export default function Details() {
  const { product } = useItemStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null); 

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]); 
    }
  }, [product]);
  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>لا يوجد منتج للعرض</Text>
      </View>
    );
  }
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SDG", {
      style: "currency",
      currency: "SDG",
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Swiper
            loop={true}
            showsPagination={true}
            paginationStyle={styles.pagination}
            dotStyle={styles.dot}
            activeDotStyle={styles.activeDot}
            style={styles.swiper}
            height={400}
          >
            {product.images?.map((uri: string, index: number) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri }}
                  alt={`صورة المنتج ${index + 1}`}
                  contentFit="cover"
                  style={styles.productImage}
                />
              </View>
            ))}
          </Swiper>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.discountPrice > 0 && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.discountPrice)}
              </Text>
            )}
          </View>

          {product.sizes && product.sizes.length > 0 && (
            <View style={styles.sizesContainer}>
              <Text style={styles.sectionTitle}>المقاسات المتاحة:</Text>
              <View style={styles.sizesRow}>
                {product.sizes.map((size: string, index: number) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.sizeBox,
                      // Correctly apply background based on selectedSize state
                      { backgroundColor: size === selectedSize ? "#30a1a7" : "#fff" },
                      // Optionally, add a border for unselected items to differentiate
                      size !== selectedSize && { borderColor: '#ddd' }
                    ]}
                    onPress={() => {
                      setSelectedSize(size); // Correctly update the state
                    }}
                  >
                    {/* Optionally change text color based on selection */}
                    <Text
                      style={[
                        styles.sizeText,
                        { color: size === selectedSize ? '#fff' : '#333' }
                      ]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>الوصف:</Text>
              <Text numberOfLines={3} style={styles.description}>
                {product.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <AddToCartButton
          product={product}
          selectedSize={selectedSize??""}
          //@ts-ignore
          buttonStyle={[
            styles.addToCartButton,
            product.stock === 0 && styles.disabledButton,
          ]}
          disabled={product.stock === 0}
        />
      </View>
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
  errorText: {
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    marginTop: 50,
  },
  imageContainer: {
    height: 400, // Matched with Swiper height
    backgroundColor: "#f5f5f5",
  },
  swiper: {
    height: 400, // Explicitly set height for Swiper
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  pagination: {
    bottom: 20,
  },
  dot: {
    backgroundColor: "rgba(0,0,0,0.2)", // Changed for better contrast
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  activeDot: {
    backgroundColor: "#30a1a7",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  productDetails: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#30a1a7",
  },
  originalPrice: {
    fontSize: 18,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 10,
  },
  sizesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
    marginBottom: 10,
  },
  sizesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  sizeBox: {
    backgroundColor: "#f0f0f0", // Default background for unselected
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8, // Use marginLeft for spacing in LTR. For RTL, consider marginEnd or adjust based on layout.
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333", // Default text color for unselected
  },
  stockContainer: {
    marginBottom: 20,
  },
  stockText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
  },
  inStock: {
    color: "#4CAF50",
  },
  outOfStock: {
    color: "#F44336",
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    textAlign: "right",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addToCartButton: {
    backgroundColor: "#30a1a7",
    borderRadius: 12,
    paddingVertical: 15,
    width: "100%",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});