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
  TextInput,
} from "react-native";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrderStore } from "@/store/orderStore";
import ItemCard from "@/app/components/ItemCard";
import useItemStore from "@/store/useItemStore";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView } from "@gorhom/bottom-sheet";

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
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhoneNumber, setDeliveryPhoneNumber] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');


  const memoizedCartItems = useMemo(() => cartItems, [cartItems]);
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
  }, []);


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
    if (!deliveryAddress || !deliveryPhoneNumber) {
        Alert.alert("خطأ", "يرجى إدخال العنوان ورقم الهاتف للتوصيل.");
        return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      if (token) {
        const orderData = {
            cartItems: cartItems,
            deliveryAddress,
            deliveryPhoneNumber,
            deliveryInstructions,
            totalPrice,
        };
        const createdOrder = await createOrder(token, orderData);

        if (createdOrder) {
          setIsModalVisible(true);
          bottomSheetModalRef.current?.dismiss();
        }
      }
    } catch (err: any) {
      console.error("فشل في إتمام الطلب:", err);
      if (err.message && err.message.includes("Network request failed")) {
          Alert.alert("خطأ", "فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.");
      } else {
          Alert.alert("خطأ", "فشل في إتمام الطلب. حاول مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                  color={item.quantity <= 1 ? "#ccc" : "#30a1a7"}
                />
              </TouchableOpacity>
              <Text className="mx-4 text-lg font-semibold">
                {item.quantity}
              </Text>
              <TouchableOpacity
                onPress={() => handleQuantityChange(item.product, 1)}
                className="bg-gray-200 p-2 rounded-full"
              >
                <Ionicons name="add" size={20} color="#30a1a7" />
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

  const totalQuantityOfAllItems = useMemo(() => cartItems.reduce(
    (accumulator: number, currentItem: any) => {
      return accumulator + currentItem.quantity;
    },
    0
  ), [cartItems]);

  return (
    <>
      <StatusBar style="dark" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
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
                    <Ionicons name="cart-outline" size={30} color="#30a1a7" />
                    {totalQuantityOfAllItems > 0 && (
                      <View className="absolute -top-2 -left-2 rounded-full bg-red-400 w-6 h-6 items-center justify-center">
                        <Text className="text-white text-md font-bold">
                          {totalQuantityOfAllItems}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              ),
            }}
          />

          {isLoading && cartItems.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#30a1a7" />
            </View>
          ) : memoizedCartItems.length === 0 ? (
            <FlatList
              ListHeaderComponent={
                <View style={{ flex: 1, alignItems: "center", paddingTop: 50 }}>
                  <Ionicons name="cart-outline" size={80} color="#30a1a7" />
                  <Text style={{ fontSize: 22, color: "#30a1a7", marginTop: 10, fontWeight: "bold" }}>
                    سلة التسوق فارغة
                  </Text>
                  <Text style={{ fontSize: 16, color: "#777", marginTop: 5, marginBottom: 30 }}>
                    ابدأ بالتسوق لإضافة منتجاتك المفضلة!
                  </Text>

                  <View style={{ alignItems: "flex-end", width: "100%", paddingHorizontal: 20, marginBottom: 10 }}>
                    <Text style={{ fontSize: 20, color: "#e98c22", fontWeight: "bold" }}>
                      منتجات قد تعجبك
                    </Text>
                  </View>
                </View>
              }
              numColumns={2}
              data={products}
              onEndReached={async () => getProducts()}
              onEndReachedThreshold={0.5}
              columnWrapperStyle={styles.columnWrapper}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable onPress={() => handlePress(item)}>
                  <ItemCard item={item} />
                </Pressable>
              )}
              ListFooterComponent={
                <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                  {hasMore ? (
                    <ActivityIndicator size="large" color="#30a1a7" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#e98c22",
                        alignSelf: "center",
                        marginTop: 10
                      }}
                    >
                      لا توجد المزيد من المنتجات.
                    </Text>
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
                  <Text className="text-lg font-bold text-[#30a1a7]">
                    {totalPrice.toFixed(2)} جنيه
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handlePresentModalPress}
                  className="bg-[#30a1a7] p-4 rounded-full"
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
              animationType="fade"
              transparent={true}
              onRequestClose={() => setIsModalVisible(false)}
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setIsModalVisible(false)}
              >
                <View
                  style={styles.modalContent}
                >
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="checkmark-circle" size={60} color="green" />
                    <Text
                      style={{ fontSize: 22, fontWeight: "bold", marginTop: 15, color: '#333', textAlign: 'center' }}
                    >
                      تم إرسال الطلب بنجاح!
                    </Text>
                    <Text style={{ fontSize: 16, marginTop: 8, color: '#555', textAlign: 'center' }}>
                      سيتم التواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        router.replace("/(tabs)/home"); 
                        setIsModalVisible(false);
                        setCartItems([]);
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        متابعة التسوق
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#e98c22', marginTop: 10 }]} 
                      onPress={() => {
                        router.replace("/(tabs)/orders");
                        setIsModalVisible(false);
                        setCartItems([]);
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        عرض طلباتي
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Modal>
          }
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={['75%']}
            onChange={handleSheetChanges}
            enableDismissOnClose={true} 
            backdropComponent={({ style }) => (
              <Pressable style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} onPress={() => bottomSheetModalRef.current?.dismiss()} />
            )}
          >
            <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
              <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: 'center', color: '#30a1a7' }}>
                معلومات التوصيل
              </Text>

              <Text style={styles.inputLabel}>العنوان الكامل:</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: بورتسودان , حي الشاطئ , مربع 5 , الشارع العام "
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>رقم الهاتف:</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: 09XXXXXXXX"
                keyboardType="phone-pad"
                value={deliveryPhoneNumber}
                onChangeText={setDeliveryPhoneNumber}
              />

              <Text style={styles.inputLabel}>تعليمات إضافية للتوصيل (اختياري):</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: التوصيل بعد الساعة 5 مساءً"
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
               <TouchableOpacity
                onPress={checkOut}
                disabled={isLoading}
                style={[styles.checkoutButton, isLoading && { opacity: 0.7 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.checkoutButtonText}>
                    تأكيد الطلب
                  </Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 50 }} /> 
            </BottomSheetScrollView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: "space-around",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'right',
    paddingRight: 10,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
    textAlign: 'right', 
  },
  checkoutButton: {
    backgroundColor: '#30a1a7',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginHorizontal: 30, 
  },
  modalButton: {
    marginTop: 25,
    backgroundColor: "#30a1a7",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  modalButtonText: {
    fontSize: 17,
    color: "white",
    fontWeight: 'bold',
  },
});