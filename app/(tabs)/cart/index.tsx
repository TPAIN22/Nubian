import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
  Vibration,
  Modal,
  TextInput,
} from "react-native";
import styles from "./styles";
import { useAuth } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import useCartStore from "@/store/useCartStore";
import Toast from "react-native-toast-message";
import Divider from "@/app/components/Devider";
import BottomSheet, {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetView,
  TouchableOpacity,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useOrderStore } from "@/store/orderStore";

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
  const { createOrder, isLoading, error, order } = useOrderStore();
  const headerHeight = useHeaderHeight();
  const { getToken } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [quantityInputVisible, setQuantityInputVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [manualQuantity, setManualQuantity] = useState("");

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
      Vibration.vibrate(50);
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

  const handleLongPressQuantity = useCallback((productId: string) => {
    setSelectedProductId(productId);
    setManualQuantity("");
    setQuantityInputVisible(true);
  }, []);

  const confirmManualQuantity = useCallback(() => {
    if (selectedProductId && manualQuantity) {
      const newQty = parseInt(manualQuantity);
      if (newQty > 0) {
        setQuantities((prev) => ({
          ...prev,
          [selectedProductId]: newQty
        }));
        setHasChanges(true);
      }
    }
    setQuantityInputVisible(false);
    setSelectedProductId(null);
  }, [selectedProductId, manualQuantity]);

  const handleSubmitOrder = async () => {
    const token = await getToken();
    try {
      setIsSubmitting(true);
      if (!token) {
        Toast.show({
          type: "error",
          text1: "يرجى تسجيل الدخول أولاً",
        });
        return;
      }

      // Save any pending changes before submitting the order
      if (hasChanges) {
        await handleSaveChanges();
      }

      await createOrder(token);
      await getCart(token);
      setQuantities({});
      bottomSheetRef.current?.close();
      Toast.show({
        type: "success",
        text1: "تم ارسال الطلب بنجاح",
        swipeable: true
      });
      setVisible(true);
    } catch (error) {
      console.error("Error submitting order:", error);
      Toast.show({
        type: "error",
        text1: "حدث خطأ أثناء إرسال الطلب",
        text2: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

    Alert.alert(
      "تأكيد الحذف",
      "هل أنت متأكد من حذف هذا المنتج من السلة؟",
      [
        {
          text: "إلغاء",
          style: "cancel"
        },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
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
                text2: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى",
              });
            } finally {
              setRemovingItemId(null);
            }
          }
        }
      ]
    );
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
    // Check if there are unsaved changes
    if (hasChanges) {
      Alert.alert(
        "تغييرات غير محفوظة",
        "هناك تغييرات في السلة لم يتم حفظها. هل تريد حفظها أولاً؟",
        [
          {
            text: "لا",
            onPress: () => bottomSheetRef.current?.expand()
          },
          {
            text: "نعم",
            onPress: async () => {
              await handleSaveChanges();
              bottomSheetRef.current?.expand();
            }
          }
        ]
      );
    } else {
      bottomSheetRef.current?.expand();
    }
  }, [hasChanges]);

  // Calculate total price using useMemo
  const totalPrice = useMemo(() => {
    return cartItems.reduce((total: number, item: CartItem) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }, [cartItems]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      if (!item?.product) return null;
      const currentQuantity = quantities[item.product._id] || item.quantity;
      const isBeingRemoved = removingItemId === item.product._id;
      const hasItemChanges = currentQuantity !== item.quantity;

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
                <Text style={styles.totalItemPrice}>
                  المجموع: {item.product.price * currentQuantity} SDG
                </Text>
              </View>
              <View style={styles.quantityContainer}>
                <Pressable
                  onPress={() => handleQuantityChange(item.product._id, false)}
                  style={styles.quantityButton}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color="#006348"
                  />
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  onLongPress={() => handleLongPressQuantity(item.product._id)}
                  style={styles.quantityButton}
                >
                  <Text style={styles.quantity}>{currentQuantity}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleQuantityChange(item.product._id, true)}
                  style={styles.quantityButton}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#006348"
                  />
                </Pressable>
                {isBeingRemoved ? (
                  <ActivityIndicator
                    size="small"
                    color="#006348"
                    style={{ width: 24, height: 24 }}
                  />
                ) : (
                  <Pressable
                    onPress={() => handleRemoveFromCart(item.product._id)}
                    disabled={isSaving || !!removingItemId}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color="#FAADADFF"
                    />
                  </Pressable>
                )}
              </View>
            </View>
            {hasItemChanges && (
              <View style={styles.saveButtonContainer}>
                <Pressable
                  onPress={() => handleSaveChanges()}
                  disabled={isSaving}
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
                  )}
                </Pressable>
              </View>
            )}
            <View style={{ marginTop: 20 }}>
              <Divider />
            </View>
          </View>
        </View>
      );
    },
    [quantities, isSaving, removingItemId]
  );
  
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={24}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#006348" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>إرسال الطلب</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [isSubmitting]
  );

  return (
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
        }}
      />
      
      {/* الكمية المُدخلة يدويًا Modal */}
      <Modal
        transparent
        visible={quantityInputVisible}
        animationType="fade"
        onRequestClose={() => setQuantityInputVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
            width: '80%',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 15,
              color: '#333',
              textAlign: 'center',
            }}>
              تحديد الكمية
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 10,
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 20,
                width: '100%',
              }}
              keyboardType="numeric"
              value={manualQuantity}
              onChangeText={setManualQuantity}
              placeholder="أدخل الكمية"
              autoFocus
            />
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              width: '100%' 
            }}>
              <Pressable
                style={{
                  backgroundColor: '#ccc',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  width: '45%',
                }}
                onPress={() => setQuantityInputVisible(false)}
              >
                <Text style={{ textAlign: 'center', color: '#333', fontWeight: 'bold' }}>
                  إلغاء
                </Text>
              </Pressable>
              <Pressable
                style={{
                  backgroundColor: '#006348',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  width: '45%',
                }}
                onPress={confirmManualQuantity}
              >
                <Text style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
                  تأكيد
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* تأكيد الطلب Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 15,
            padding: 20,
            width: '90%',
            maxHeight: '80%',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
            <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="checkmark-circle" size={50} color="#006348" />
              <Text style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: '#006348',
                marginTop: 10,
                textAlign: 'center',
              }}>تم استلام طلبك بنجاح</Text>
            </View>
            
            <View style={{
              borderWidth: 1,
              borderColor: '#eaeaea',
              borderRadius: 10,
              padding: 15,
              marginBottom: 15,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
                textAlign: 'center',
              }}>ملخص الطلب</Text>
              {cartItems.map((item: CartItem) => (
                <View key={item.product._id} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eaeaea',
                }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}>
                    {item.product.price * item.quantity} SDG
                  </Text>
                  <View style={{
                    alignItems: 'flex-end',
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      {item.product.name}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#666',
                      marginTop: 5,
                    }}>
                      الكمية: {item.quantity}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: '#ddd',
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#006348',
                }}>{totalPrice} SDG</Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>المجموع الكلي:</Text>
              </View>
            </View>

            <Text style={{
              fontSize: 14,
              color: '#555',
              textAlign: 'center',
              marginBottom: 20,
            }}>
              تم استلام طلبكم وسيتم التواصل معك لتأكيد الطلب
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: '#006348',
                paddingVertical: 12,
                borderRadius: 25,
                alignItems: 'center',
                elevation: 3,
              }}
              onPress={() => {
                setVisible(false);
                router.replace("/(tabs)/home");
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
              }}>العودة للمتجر</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={[styles.centered, { marginTop: headerHeight }]}>
        {isCartLoading && !isSaving && !removingItemId ? (
          <ActivityIndicator size="large" color="#006348" />
        ) : (
          <FlatList
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color="#006348" />
                <Text style={styles.emptyText}>
                  لا توجد منتجات في السلة
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
        )}
      </View>

      {/* أزرار أسفل الشاشة */}
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
            {/* زر "العودة للمتجر" */}
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
            
            {/* زر "اتمام الطلب" */}
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
                {hasChanges ? "حفظ واتمام الطلب" : "اتمام الطلب"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* BottomSheet لتأكيد الطلب */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["60%"]}
        enablePanDownToClose={true}
        footerComponent={renderFooter}
        enableDynamicSizing={true}
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
                  <Text
                    style={[styles.summaryItemName, { textAlign: "right" }]}
                  >
                    {item.product.name}
                  </Text>
                  <Text
                    style={[
                      styles.summaryItemQuantity,
                      { textAlign: "right" },
                    ]}
                  >
                    الكمية: {item.quantity}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.totalContainer, { borderTopWidth: 0 }]}>
              <Text style={styles.totalPrice}>{totalPrice} SDG</Text>
              <Text style={[styles.totalText, { textAlign: "right" }]}>
                المجموع الكلي:
              </Text>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

export default CartPage;