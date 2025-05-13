import { Image } from "expo-image";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import useItemStore from "@/store/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useHeaderHeight } from "@react-navigation/elements";
import AddToCartButton from "./components/AddToCartButton";

const SIZES = ["S", "M", "L", "XL"];

export default function ProductDetails() {
  const headerHeight = useHeaderHeight();
  const { product } = useItemStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");

  // Handle quantity changes
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  if (!product) {
    return (
      <View style={[styles.container, { marginTop: headerHeight }]}>
        <Text style={{ fontSize: 18, color: "#A37E2C" }}>
          Product not found or still loading...
        </Text>
      </View>
    );
  }  
  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Product Details",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
          headerShown: true,
          headerTransparent: true,
          headerRight: () => (
            <Ionicons name="cart-outline" size={24} color="#A37E2C" />
          ),
        }}
      />
      <View style={[styles.container, { marginTop: headerHeight }]}>
        <Image source={{ uri: product?.images?.[0] }} style={styles.image} />
        <Text style={styles.name}>{product?.name}</Text>
        <View style={styles.details}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ fontSize: 12, color: "#006348" }}>SDG</Text>
            <Text style={styles.price}>{product?.price}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable 
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove-sharp" size={24} color={quantity <= 1 ? "#cccccc" : "#A37E2C"} />
            </Pressable>
            <Text style={styles.counter}>{quantity}</Text>
            <Pressable onPress={increaseQuantity}>
              <Ionicons name="add-sharp" size={24} color="#A37E2C" />
            </Pressable>
          </View>
        </View>
        <View style={{ width: "100%", alignItems: "flex-end", marginTop: 10 }}>
          <Text>Size</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              justifyContent: "space-around",
            }}
          >
            {SIZES.map((size) => (
              <Pressable key={size} onPress={() => setSelectedSize(size)}>
                <Text 
                  style={[
                    styles.size, 
                    selectedSize === size && { 
                      backgroundColor: "#A37E2C", 
                      color: "#FFFFFF",
                      borderColor: "#A37E2C" 
                    }
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View
          style={{
            width: "100%",
            marginTop: 10,
            position: "absolute",
            bottom: 40,
          }}
        >
          <AddToCartButton
            product={{ ...product, quantity, size: selectedSize }}
            title="Add to cart"
            buttonStyle={styles.secondary}
            textStyle={{
              color: "#FFEDD6FF",
              fontSize: 20,
              fontWeight: "bold",
            }}
          />
          <Pressable style={styles.primary}>
            <Text
              style={{
                color: "#E9FFF9FF",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              Purchase
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  size: {
    marginHorizontal: 10,
    padding: 15,
    borderColor: "#1D161699",
    borderWidth: 1,
    borderRadius: 6,
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
    height: 260,
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