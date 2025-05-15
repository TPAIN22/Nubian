import React, { useEffect, useCallback, useState, useRef } from "react";
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
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import useCartStore from "@/store/useCartStore";
import Toast from "react-native-toast-message";
import Divider from "@/app/components/Devider";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { getCart, cartItems, updateCartItem, removeFromCart, isCartLoading } =
    useCartStore();
  const headerHeight = useHeaderHeight();
  const { getToken } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const router = useRouter();
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

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

  const handleQuantityChange = useCallback(
    (productId: string, increment: boolean) => {
      setQuantities((prev) => {
        const currentQty = prev[productId] || 0;
        const newQty = increment ? currentQty + 1 : Math.max(1, currentQty - 1);

        if (newQty === currentQty) return prev;

        setHasChanges(true);
        return { ...prev, [productId]: newQty };
      });
    },
    []
  );

  const handleRemoveFromCart = async (productId: string) => {
    if (removingItemId === productId || isSaving) return;

    const token = await getToken();
    if (!token) {
      Toast.show({
        type: "error",
        text1: "يرجى تسجيل الدخول أولاً",
      });
      return;
    }
    setRemovingItemId(productId);
    try {
      await removeFromCart(productId, token);
      Toast.show({
        type: "success",
        text1: "تم حذف المنتج من السلة",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "حدث خطأ أثناء حذف المنتج",
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleSaveChanges = async () => {
    if (isSaving) return;

    const token = await getToken();
    if (!token) {
      Toast.show({
        type: "error",
        text1: "يرجى تسجيل الدخول أولاً",
      });
      return;
    }

    setIsSaving(true);
    Toast.show({
      type: "info",
      text1: "جاري حفظ التغييرات...",
      visibilityTime: 2000,
    });

    try {
      const updatePromises = cartItems
        .map((item: CartItem) => {
          if (!item?.product?._id) return null;
          const newQuantity = quantities[item.product._id];
          const currentQuantity = item.quantity;

          if (newQuantity !== undefined && newQuantity !== currentQuantity) {
            if (newQuantity === 0) {
              return removeFromCart(item.product._id, token);
            } else {
              const diff = newQuantity - currentQuantity;
              return updateCartItem(item.product, token, diff);
            }
          }
          return null;
        })
        .filter(Boolean) as Promise<void>[];

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      await getCart(token);

      setHasChanges(false);
      Toast.show({
        type: "success",
        text1: "تم حفظ التغييرات بنجاح",
      });
    } catch (error) {
      console.error("Error saving cart changes:", error);
      Toast.show({
        type: "error",
        text1: "حدث خطأ أثناء حفظ التغييرات",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpandBottomSheetPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  // Calculate total price
  const totalPrice = cartItems.reduce((total: number, item: CartItem) => {
    return total + (item.product.price * item.quantity);
  }, 0);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      if (!item?.product) return null;
      const currentQuantity = quantities[item.product._id] || item.quantity;
      const isBeingRemoved = removingItemId === item.product._id;

      return (
        <View style={styles.item}>
          <Image
            source={{
              uri:
                item.product.images?.[0] ||
                "https://placehold.jp/3d4070/ffffff/150x150.png",
            }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.product.name}</Text>
                <Text style={styles.price}>{item.product.price} SDG</Text>
              </View>
              <View style={styles.quantityContainer}>
                <Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color="#006348"
                  onPress={() => handleQuantityChange(item.product._id, false)}
                />
                <Text style={styles.quantity}>{currentQuantity}</Text>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color="#006348"
                  onPress={() => handleQuantityChange(item.product._id, true)}
                />
                {isBeingRemoved ? (
                  <ActivityIndicator
                    size="small"
                    color="#006348"
                    style={{ width: 24, height: 24 }}
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color="#FAADADFF"
                    onPress={() => handleRemoveFromCart(item.product._id)}
                    disabled={isSaving || !!removingItemId}
                  />
                )}
              </View>
            </View>
            <View style={{ marginTop: 20 }}>
              <Divider />
            </View>
          </View>
        </View>
      );
    },
    [quantities]
  );

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        <Stack.Screen
          options={{
            headerLeft: () => (
              <Ionicons name="cart-outline" size={24} color="#555958FF" />
            ),
            headerTransparent: true,
            headerTitleAlign: "center",
            title: "السلة",
            headerTitleStyle: { fontSize: 25, color: "#242423C5" },
            headerRight: () =>
              hasChanges && (
                <Pressable
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                  style={{ marginRight: 15 }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#006348" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFEDD6",
                        fontSize: 18,
                        backgroundColor: "#006348",
                        paddingHorizontal: 12,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}
                    >
                      حفظ
                    </Text>
                  )}
                </Pressable>
              ),
          }}
        />
        <View style={[styles.centered, { marginTop: headerHeight }]}>
          {isCartLoading && !isSaving && !removingItemId ? (
            <ActivityIndicator size="large" color="#006348" />
          ) : (
            <>
              <FlatList
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="basket-outline" size={48} color="#006348" />
                    <Text style={styles.emptyText}>
                      لا توجد منتجات في السلة {"\n"}تحقق من اتصال الإنترنت
                    </Text>
                  </View>
                }
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) =>
                  item?.product?._id?.toString() || Math.random().toString()
                }
                style={styles.list}
              />
            </>
          )}
        </View>
        {cartItems.length > 0 && (
          <View style={{ position: "absolute", bottom: 80, width: "100%" }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                paddingHorizontal: 20,
              }}
            >
              <Pressable
                style={{
                  backgroundColor: "#006348",
                  width: "48%",
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 30,
                }}
                onPress={() => router.replace("/(tabs)/home")}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  العودة للمتجر
                </Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: "#A37E2C",
                  width: "48%",
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 30,
                }}
                onPress={handleExpandBottomSheetPress}
              >
                <Text
                  style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
                >
                  اتمام الطلب
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          onChange={handleSheetChanges}
          snapPoints={["60%"]}
          enablePanDownToClose={true}
        >
          <BottomSheetView style={styles.contentContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>ملخص الطلب</Text>
            </View>

            <View style={styles.orderSummary}>
              {cartItems.map((item: CartItem) => (
                <View key={item.product._id} style={styles.summaryItem}>
                  <Text style={styles.summaryItemPrice}>
                    {item.product.price * item.quantity} SDG
                  </Text>
                  <View style={styles.summaryItemLeft}>
                    <Text style={[styles.summaryItemName, { textAlign: 'right' }]}>{item.product.name}</Text>
                    <Text style={[styles.summaryItemQuantity, { textAlign: 'right' }]}>الكمية: {item.quantity}</Text>
                  </View>
                </View>
              ))}
              
              <View style={[styles.totalContainer, { borderTopWidth: 0 }]}>
                <Text style={styles.totalPrice}>{totalPrice} SDG</Text>
                <Text style={[styles.totalText, { textAlign: 'right' }]}>المجموع الكلي:</Text>
              </View>
            </View>

            <Pressable 
              style={styles.submitButton}
              onPress={() => {
                // Handle order submission
                console.log("Submitting order...");
              }}
            >
              <Text style={styles.submitButtonText}>إرسال الطلب</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  list: {
    width: "100%",
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  bottomSheetHeader: {
    width: '100%',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#006348",
    textAlign: "center",
  },
  orderSummary: {
    flex: 1,
    width: '100%',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryItemLeft: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  summaryItemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#006348',
    marginRight: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006348',
  },
  submitButton: {
    backgroundColor: '#A37E2C',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 50,
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quantity: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: "#006348",
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
    color: "#006348",
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
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
});

export default CartPage;
