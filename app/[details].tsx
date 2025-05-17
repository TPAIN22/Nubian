import { Image } from "expo-image";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator, Animated, Alert } from "react-native";
import useItemStore from "@/store/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useHeaderHeight } from "@react-navigation/elements";
import AddToCartButton from "./components/AddToCartButton";
import * as Haptics from 'expo-haptics';

const SIZES = ["S", "M", "L", "XL"];
const DEFAULT_IMAGE = "https://placehold.jp/3d4070/ffffff/150x150.png";

export default function ProductDetails() {
  const headerHeight = useHeaderHeight();
  const { product } = useItemStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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
            <View style={styles.imageLoaderContainer}>
              <ActivityIndicator 
                size="large" 
                color="#A37E2C" 
              />
              <Text style={styles.loadingText}>جاري تحميل الصورة...</Text>
            </View>
          )}
          <Image
            source={{ uri: DEFAULT_IMAGE || product?.images?.[0] }}
            style={styles.image}
            onLoadEnd={() => setIsImageLoading(false)}
            onError={handleImageError}
            transition={1000}
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
          {!selectedSize && <Text style={styles.sizeInfoText}>* الرجاء اختيار المقاس</Text>}
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
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <AddToCartButton
              product={product ? { ...product, quantity, size: selectedSize } : undefined}
              title="إضافة للسلة"
              buttonStyle={StyleSheet.flatten([styles.secondary, !selectedSize && styles.buttonDisabled].filter(Boolean))}
              textStyle={styles.buttonText}
              disabled={!selectedSize}
            />
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable 
              style={StyleSheet.flatten([styles.primary, !selectedSize && styles.buttonDisabled].filter(Boolean))}
              disabled={!selectedSize}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => {
                if (selectedSize) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  console.log("Buy Now pressed with product:", product, "quantity:", quantity, "size:", selectedSize);
                }
              }}
            >
              <Text style={styles.buttonText}>
                شراء الآن
              </Text>
            </Pressable>
          </Animated.View>
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    color: '#A37E2C',
    fontSize: 16,
  },
  sizesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-around",
    width: "100%",
  },
  sizeButton: {
    marginHorizontal: 5,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: "#FFCCCC",
  },
  selectedSize: {
    backgroundColor: "#CCE5FF",
  },
  pressedSize: {
    opacity: 0.7,
  },
  sizeText: {
    color: "#1D161699",
  },
  selectedSizeText: {
    color: "#FFFFFF",
  },
  sizeInfoText: {
    color: "#D32F2F",
    fontSize: 18,
    textAlign: "right",
    width: "100%",
    marginTop: 4,
    marginBottom: 6,
  },
  buttonsContainer: {
    width: "100%",
    marginTop: 10,
    position: "absolute",
    bottom: 40,
  },
  buttonText: {
    color: "#FAFAFAFF",
    fontSize: 24,
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
  buttonDisabled: {
    backgroundColor: "#E0E0E0",
    opacity: 0.7,
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