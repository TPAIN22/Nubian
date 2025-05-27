import {
  View,
  Text,
  Dimensions,
  ScrollView,
} from "react-native";
import React from "react";
import { Image } from "expo-image";
import useItemStore from "@/store/useItemStore";
import AddToCartButton from "./components/AddToCartButton";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function Details() {
  const { product } = useItemStore();
  const [quantity, setQuantity] = React.useState(1);
  const [size, setSize] = React.useState<string | null>(null);
  const headerHeight = useHeaderHeight();

  const productImages = product.images?.length
    ? product.images
    : [product.image];

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          title: "تفاصيل المنتج",
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerTransparent: true,
          headerTintColor: "#A37E2C",
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: "600",
            color: "#A37E2C",
          },
          headerRight: () => (
            <Image
              source={require("../assets/images/icon.png")}
              style={{ width: 60, height: 60 }}
            />
          ),
        }}
      />

      <ScrollView style={{ backgroundColor: "#fff", paddingTop: headerHeight }}>
        {/* سلايدر الصور */}
        <View
          style={{
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width }}
          >
            {productImages.map((imgUri: string, index: number) => (
              <Image
                key={index}
                source={{ uri: imgUri }}
                style={{
                  width: width - 20,
                  height: 250,
                  marginHorizontal: 10,
                  borderRadius: 20,
                }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        </View>

        {/* باقي تفاصيل المنتج */}
        <View style={{ gap: 30 }}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "bold",
              textAlign: "right",
              paddingHorizontal: 20,
            }}
          >
            {product.name}
          </Text>

          {/* الكمية والسعر */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name="add-circle"
                size={38}
                color="#A37E2C"
                onPress={() => setQuantity(quantity + 1)}
              />
              <Text style={{ fontSize: 16, color: "#006348" }}>{quantity}</Text>
              <Ionicons
                name="remove-circle"
                size={38}
                color="#000"
                onPress={() => {
                  if (quantity > 1) setQuantity(quantity - 1);
                }}
              />
            </View>
            <Text style={{ fontSize: 20, color: "#006348" }}>
              {`SDG ${product.price}`}
            </Text>
          </View>

          {/* اختيار المقاس */}
          {product.sizes?.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 20 }}>
              {product.sizes.map((item: string, index: number) => {
                const isSelected = size === item;
                return (
                  <Text
                    key={index}
                    onPress={() => setSize(item)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isSelected ? "#A37E2C" : "#ccc",
                      backgroundColor: isSelected ? "#A37E2C" : "#fff",
                      color: isSelected ? "#fff" : "#000",
                    }}
                  >
                    {item}
                  </Text>
                );
              })}
            </View>
          )}

          {/* وصف المنتج */}
          <View style={{ paddingHorizontal: 20, alignSelf: "flex-end" }}>
            <Text style={{ fontSize: 16, color: "#006348" }}>
              {product.description}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* زر الإضافة إلى السلة */}
      <AddToCartButton
        product={{ ...product, size: size || undefined, quantity }}
        title="اضافة الى السلة"
        textStyle={{ color: "#fff" }}
        buttonStyle={{
          backgroundColor: "#A37E2C",
          borderRadius: 20,
          width: "90%",
          alignSelf: "center",
          marginBottom: 30,
        }}
      />
    </>
  );
}
