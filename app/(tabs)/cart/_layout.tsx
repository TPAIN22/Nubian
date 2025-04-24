import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://fakestoreapi.com/products?limit=5"
      );
      setCartItems(response.data);
    } catch (error) {
      console.error("خطأ في جلب المنتجات:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);



  const handleRemove = (id:any) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalPrice = cartItems
    .reduce((acc, item) => acc + item.price, 0)
    .toFixed(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <View className="flex-1 mb-20"> 
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 15,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#eee",
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={24} color="#A37E2C" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#A37E2C",
            marginLeft: 15,
          }}
        >
          سلة المشتريات
        </Text>
      </View>

      {/* المحتوى */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#A37E2C" />
        ) : cartItems.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>
            لا توجد منتجات في السلة حالياً.
          </Text>
        ) : (
          cartItems.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                backgroundColor: "#f9f9f9",
                marginBottom: 15,
                borderRadius: 12,
                overflow: "hidden",
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
              <View style={{ flex: 1, padding: 10 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#A37E2C",
                    marginBottom: 5,
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#444",
                    marginBottom: 5,
                  }}
                  numberOfLines={2}
                >
                  {item.description ? item.description : "لا يوجد وصف"}
                </Text>
                <Text style={{ color: "#006348", fontWeight: "bold" }}>
                  السعر: {item.price} $
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                style={{
                  justifyContent: "center",
                  paddingHorizontal: 10,
                }}
              >
                <Ionicons name="trash" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* إجمالي السعر + الأزرار */}
      {!loading && cartItems.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            right: 10,
            backgroundColor: "#fff",
            padding: 10,
            borderRadius: 12,
            zIndex: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            elevation: 0,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#006348",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            الإجمالي: {totalPrice} $
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 15,
                backgroundColor: "#006348",
                borderRadius: 10,
              }}
              onPress={() => router.push("/(tabs)/home")}
            >
              <Text
                style={{ color: "#fff", fontSize: 16, textAlign: "center" }}
              >
                متابعة التسوق
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                padding: 15,
                backgroundColor: "#A37E2C",
                borderRadius: 10,
              }}
              onPress={() => Alert.alert("🚚", "تم إرسال الطلب بنجاح" )}
            >
              <Text
                style={{ color: "#fff", fontSize: 16, textAlign: "center" }}
              >
                إتمام الطلب
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}
