import { Image } from "expo-image";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import useItemStore from "@/store/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useHeaderHeight } from "@react-navigation/elements";
import AddToCartButton from "./components/AddToCartButton";

const SIZES = ["S", "M", "L", "XL"];
const DEFAULT_IMAGE = "https://via.placeholder.com/400x260?text=No+Image";

export default function ProductDetails() {
  const headerHeight = useHeaderHeight();
  const { product } = useItemStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isImageLoading, setIsImageLoading] = useState(true);

  if (!product) {
    return (
      <View style={[styles.container, { marginTop: headerHeight }]}>
        <ActivityIndicator size="large" color="#A37E2C" />
        <Text style={{ fontSize: 18, color: "#A37E2C", marginTop: 10 }}>
          جاري تحميل المنتج...
        </Text>
      </View>
    );
  }

  const handleImageError = () => {
    setIsImageLoading(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "تفاصيل المنتج",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
          headerShown: true,
          headerTransparent: true,
          headerRight: () => (
            <Ionicons name="cart-outline" size={24} color="#A37E2C" />
          ),
        }}
      />
      <View style={[styles.container, { marginTop: headerHeight }]}>
        <View style={styles.imageContainer}>
          {isImageLoading && (
            <ActivityIndicator 
              size="large" 
              color="#A37E2C" 
              style={styles.imageLoader} 
            />
          )}
          <Image
            source={{ uri: product?.images?.[0] || DEFAULT_IMAGE }}
            style={styles.image}
            onLoadEnd={() => setIsImageLoading(false)}
            onError={handleImageError}
          />
        </View>
        <Text style={styles.name}>{product?.name || "اسم المنتج غير متوفر"}</Text>
        <View style={styles.details}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ fontSize: 12, color: "#006348" }}>SDG</Text>
            <Text style={styles.price}>{product?.price || 0}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable 
              onPress={() => quantity > 1 && setQuantity(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove-sharp" size={24} color={quantity <= 1 ? "#cccccc" : "#A37E2C"} />
            </Pressable>
            <Text style={styles.counter}>{quantity}</Text>
            <Pressable onPress={() => setQuantity(quantity + 1)}>
              <Ionicons name="add-sharp" size={24} color="#A37E2C" />
            </Pressable>
          </View>
        </View>
        <View style={{ width: "100%", alignItems: "flex-end", marginTop: 10 }}>
          <Text>المقاس</Text>
          <View style={styles.sizesContainer}>
            {SIZES.map((size) => (
              <Pressable 
                key={size} 
                onPress={() => setSelectedSize(size)}
                style={({ pressed }) => [
                  styles.sizeButton,
                  selectedSize === size && styles.selectedSize,
                  pressed && styles.pressedSize
                ]}
              >
                <Text style={[
                  styles.sizeText,
                  selectedSize === size && styles.selectedSizeText
                ]}>
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.buttonsContainer}>
          <AddToCartButton
            product={{ ...product, quantity, size: selectedSize }}
            title="إضافة للسلة"
            buttonStyle={styles.secondary}
            textStyle={styles.buttonText}
          />
          <Pressable style={styles.primary}>
            <Text style={styles.buttonText}>
              شراء الآن
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 260,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  imageLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  sizesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-around",
  },
  sizeButton: {
    marginHorizontal: 10,
    padding: 15,
    borderColor: "#1D161699",
    borderWidth: 1,
    borderRadius: 6,
  },
  selectedSize: {
    backgroundColor: "#A37E2C",
    borderColor: "#A37E2C",
  },
  pressedSize: {
    opacity: 0.8,
  },
  sizeText: {
    color: "#1D161699",
  },
  selectedSizeText: {
    color: "#FFFFFF",
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 10,
    position: "absolute",
    bottom: 40,
  },
  buttonText: {
    color: "#FFEDD6FF",
    fontSize: 20,
    fontWeight: "bold",
  },
  secondary: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#006348",
    borderRadius: 30,
    padding: 10,
    marginTop: 10,
  },
  primary: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A37E2C",
    borderRadius: 30,
    padding: 10,
    marginTop: 10,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 10,
  },
  counter: {
    marginHorizontal: 10,
    padding: 8,
    borderColor: "#A185491E",
    borderWidth: 1,
    borderRadius: 10,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  price: {
    color: "#3F3D39FF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    alignSelf: "flex-end",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  name: {
    color: "#242423C5",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "right",
    alignSelf: "flex-end",
  },
});