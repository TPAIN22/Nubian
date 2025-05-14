import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import useCartStore from "@/store/useCartStore";
import Toast from "react-native-toast-message";

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
}

const CartPage = () => {
  const {
    getCart,
    cartItems,
    updateCartItem,
    removeFromCart,
    isCartLoading,
  } = useCartStore();
  const headerHeight = useHeaderHeight();
  const { getToken } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      const token = await getToken();
      if (token) {
        await getCart(token);
      }
    };
    fetchCart();
  }, []);

  useEffect(() => {
    // Initialize quantities state with current cart items
    const initialQuantities: Record<string, number> = {};
    cartItems.forEach((item: CartItem) => {
      initialQuantities[item.product._id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [cartItems]);

  const handleQuantityChange = useCallback((productId: string, increment: boolean) => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = increment ? currentQty + 1 : Math.max(1, currentQty - 1);
      
      if (newQty === currentQty) return prev;
      
      setHasChanges(true);
      return { ...prev, [productId]: newQty };
    });
  }, []);

  const handleRemoveFromCart = async (productId: string) => {
    const token = await getToken();
    if (!token) {
      Toast.show({
        type: "error",
        text1: "يرجى تسجيل الدخول أولاً",
      });
      return;
    }
    await removeFromCart(productId, token);
  };

  const handleSaveChanges = async () => {
    const token = await getToken();
    if (!token) {
      Toast.show({
        type: "error",
        text1: "يرجى تسجيل الدخول أولاً",
      });
      return;
    }

    try {
      for (const item of cartItems) {
        const newQuantity = quantities[item.product._id];
        const currentQuantity = item.quantity;
        
        if (newQuantity !== currentQuantity) {
          if (newQuantity === 0) {
            await removeFromCart(item.product._id, token);
          } else {
            const diff = newQuantity - currentQuantity;
            await updateCartItem(item.product, token, diff);
          }
        }
      }
      
      setHasChanges(false);
      Toast.show({
        type: "success",
        text1: "تم حفظ التغييرات بنجاح",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "حدث خطأ أثناء حفظ التغييرات",
      });
    }
  };

  const renderItem = useCallback(({ item }: { item: CartItem }) => {
    if (!item?.product) return null;
    const currentQuantity = quantities[item.product._id] || item.quantity;

    return (
      <View style={styles.item}>
        <Image
          source={{ uri: item.product.images?.[0] }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>{item.product.price} SDG</Text>
            </View>
            <View style={styles.quantityContainer}>
              <Ionicons
                name="remove-circle-outline"
                size={24}
                color="#A37D2C8A"
                onPress={() => handleQuantityChange(item.product._id, false)}
              />
              <Text style={styles.quantity}>{currentQuantity}</Text>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color="#A37D2C8A"
                onPress={() => handleQuantityChange(item.product._id, true)}
              />
              <Ionicons name="trash-outline" size={24} color="#A37D2C8A" onPress={() => handleRemoveFromCart(item.product._id)} />
            </View>
          </View>
        </View>
      </View>
    );
  }, [quantities]);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Ionicons name="cart-outline" size={24} color="#555958FF" />
          ),
          headerTransparent: true,
          headerTitleAlign: "center",
          title: "السلة",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
        }}
      />
      <View style={[styles.centered, { marginTop: headerHeight }]}>
        {isCartLoading ? (
          <ActivityIndicator size="large" color="#A37E2C" />
        ) : (
          <>
            <FlatList
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="basket-outline" size={48} color="#A37E2C" />
                  <Text style={styles.emptyText}>
                    لا توجد منتجات في السلة {"\n"}تحقق من اتصال الإنترنت
                  </Text>
                </View>
              }
              data={cartItems}
              renderItem={renderItem}
              keyExtractor={(item) => item?.product?._id?.toString() || Math.random().toString()}
              style={styles.list}
            />
          </>
        )}
         {hasChanges && (
              <Pressable 
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
              </Pressable>
            )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  list: {
    width: "100%",
    flex: 1,
  },
  quantity: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: "#A37D2C8A",
    borderWidth: 0.5,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#A37E2C",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    width: "100%",
  },
  image: {
    width: 70,
    height: 70,
    marginRight: 15,
    borderRadius: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  price: {
    color: "#006348",
    fontSize: 14,
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: "#006348",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginVertical: 16,
    width: "90%",
    alignItems: "center",
    position: "absolute",
    bottom: 80,
  },
  saveButtonText: {
    color: "#FFEDD6",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CartPage;
