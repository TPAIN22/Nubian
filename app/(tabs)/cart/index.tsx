import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrderStore } from "@/store/orderStore";
import ItemCard from "@/app/components/ItemCard";
import useItemStore from "@/store/useItemStore";
import { StatusBar } from "expo-status-bar";

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  totalAmount: number;
}

export default function Cart() {
  const {
    cartItems,
    totalPrice,
    setCartItems,
    getCart,
    removeFromCart,
    updateCartItem,
  } = useCartStore();
  const { createOrder } = useOrderStore();
  const { products, getProducts, setProduct, hasMore } = useItemStore();
  const { getToken } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const memoizedCartItems = useMemo(() => cartItems, [cartItems]);
  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        if (token) {
          await getCart(token);
        }
      } catch (err) {
        console.error("فشل في تحميل السلة:", err);
        Alert.alert("خطأ", "فشل في تحميل سلة التسوق. حاول مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleQuantityChange = useCallback(
    async (product: CartItem["product"], change: number) => {
      try {
        const token = await getToken();
        if (token) {
          await updateCartItem(product, token, change);
        }
      } catch (err) {
        console.error("خطأ في تحديث الكمية:", err);
        Alert.alert("خطأ", "فشل في تحديث الكمية. حاول مرة أخرى.");
      }
    },
    [updateCartItem, getToken]
  );

  const handleRemoveItem = useCallback(
    async (productId: string) => {
      Alert.alert("تأكيد الحذف", "هل تريد إزالة هذا العنصر من السلة؟", [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              if (token) {
                await removeFromCart(productId, token);
              }
            } catch (err) {
              console.error("خطأ في الحذف:", err);
              Alert.alert("خطأ", "فشل في إزالة العنصر. حاول مرة أخرى.");
            }
          },
        },
      ]);
    },
    [removeFromCart, getToken]
  );

  const checkOut = async () => {
    if (cartItems.length === 0) {
      Alert.alert("تنبيه", "سلة التسوق فارغة");
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (token) {
        const createdOrder = await createOrder(token);

        if (createdOrder) {
          setIsModalVisible(true);
        }
      }
    } catch (err) {
      console.error("فشل في إتمام الطلب:", err);
      Alert.alert("خطأ", "فشل في إتمام الطلب. حاول مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث renderOrderSummar
  const navigateToHome = useCallback(() => {
    setIsModalVisible(false);
    router.replace("/(tabs)/home");
  }, [router]);

  const navigateToOrders = useCallback(() => {
    setIsModalVisible(false);
    router.replace("/(tabs)/orders");
  }, [router]);

  const renderCartItem = useCallback(
    ({ item }: { item: CartItem }) => (
      <View className="bg-white m-2 p-4 rounded-lg shadow-sm">
        <View className="flex-row items-center">
          <Image
            source={{ uri: item.product.image }}
            className="w-20 h-20 rounded-md"
            resizeMode="cover"
          />
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold" numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text className="text-gray-600">
              {item.product.price.toFixed(2)} جنيه
            </Text>
            <View className="flex-row items-center mt-2">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.product, -1)}
                className="bg-gray-200 p-2 rounded-full"
                disabled={item.quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={item.quantity <= 1 ? "#ccc" : "#006348"}
                />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-semibold">
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.product, 1)}
                className="bg-gray-200 p-2 rounded-full"
              >
                <Ionicons name="add" size={20} color="#006348" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-500 mt-1">
              المجموع: {(item.product.price * item.quantity).toFixed(2)} جنيه
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveItem(item.product._id)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#C35555FF" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [handleQuantityChange, handleRemoveItem]
  );

  const handlePress = (item: any) => {
    setProduct(item);
    router.push(`/${item._id}`);
  };
  const totalQuantityOfAllItems = cartItems.reduce(
    (accumulator: number, currentItem: any) => {
      return accumulator + currentItem.quantity;
    },
    0
  );

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShadowVisible: false,
          headerTitle: "سلة التسوق",
          headerTitleAlign: "center",
          headerBackVisible: false,
          

          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
              }}
            >
              <Pressable className="relative items-center justify-center">
                <Ionicons name="cart-outline" size={30} color="#006348" />
                <Text className="absolute -top-2 -left-2 rounded-full bg-red-400 text-white w-6 h-6 flex text-center text-md">
                  {totalQuantityOfAllItems}
                </Text>
              </Pressable>
            </View>
          ),
        }}
      />

      {isLoading && cartItems.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#006348" />
        </View>
      ) : memoizedCartItems.length === 0 ? (
        <FlatList
          ListHeaderComponent={
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundColor: "#fff",
                }}
              >
                <Ionicons name="cart-outline" size={50} color="#006348" />
                <Text style={{ fontSize: 20, color: "#006348" }}>
                  سلة التسوق فارغة
                </Text>
              </View>
              <View style={{ flexDirection: "column", alignItems: "center" }} />
              <View
                style={{
                  alignItems: "flex-end",
                  width: "100%",
                  padding: 10,
                  justifyContent: "flex-end",
                }}
              >
                <Text style={{ fontSize: 20, color: "#A37E2C" }}>
                  اضف الى سلة التسوق
                </Text>
              </View>
            </View>
          }
          numColumns={2}
          data={products}
          onEndReached={async () => getProducts()}
          columnWrapperStyle={styles.columnWrapper}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)}>
              <ItemCard item={item} />
            </Pressable>
          )}
          ListFooterComponent={
            <View style={{ height: 100 }}>
              {hasMore ? (
                <ActivityIndicator size="large" color="#006348" />
              ) : (
                <View style={{ height: 100, marginTop: 10 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: "#A37E2C",
                      alignSelf: "center",
                    }}
                  >
                    {" "}
                    لا توجد منتجات متوفرة{" "}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      ) : (
        <View className="flex-1 bg-gray-100">
          <FlatList
            data={memoizedCartItems}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
          <View className="absolute bottom-0 left-0 right-0 bg-white p-4 shadow-md border-t border-gray-200">
            <View className="flex-row justify-between mb-4">
              <Text className="text-lg font-semibold">المجموع:</Text>
              <Text className="text-lg font-bold text-[#006348]">
                {totalPrice.toFixed(2)} جنيه
              </Text>
            </View>
            <TouchableOpacity
              onPress={checkOut}
              className="bg-[#006348] p-4 rounded-full"
            >
              <Text className="text-white text-center font-semibold text-lg">
                إتمام الطلب
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={50} color="green" />
                <Text
                  style={{ fontSize: 20, fontWeight: "bold", marginTop: 10 }}
                >
                  تم ارسال الطلب بنجاح
                </Text>
                <Text style={{ fontSize: 16, marginTop: 5 }}>
                  سيتم التواصل معك قريبا لتاكيد الطلب
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 20,
                    backgroundColor: "#006348",
                    padding: 10,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    router.push("/(tabs)/home");
                    setIsModalVisible(false);
                    setCartItems([]);
                  }}
                >
                  <Text style={{ fontSize: 16, color: "white" }}>
                    متابعة التسوق
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      }
    </>
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: "space-around",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
});
