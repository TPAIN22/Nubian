import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useCallback, useEffect, useRef } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
import CartItem from "../components/cartItem";
import Chekout from "../components/chekoutBotton";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import CheckOutModal from "../components/checkOutModal";
import { useRouter } from "expo-router";

export default function cart() {
  const { fetchCart, cart, isLoading, isUpdating, updateCartItemQuantity, removeFromCart } =
    useCartStore();
  const { getToken } = useAuth();
  const router = useRouter();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      bottomSheetModalRef.current?.dismiss();
    }
  }, []);

  useEffect(() => {
    const fetchCartData = async () => {
      const token = await getToken();
      if (token) {
        await fetchCart(token);
      }
    };
    fetchCartData();
  }, []);

  const increment = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await updateCartItemQuantity(
        token,
        item.product._id,
        1,
        item.size || null
      );
    }
  }, []);

  const decrement = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await updateCartItemQuantity(
        token,
        item.product._id,
        -1,
        item.size || null
      );
    }
  }, []);

  const deleteItem = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await removeFromCart(token, item.product._id, item.size || null);
    }
  }, []);

  const handleContinueShopping = () => {
    router.replace("/");
  };

  // حالة التحميل
  if (isLoading ) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#30a1a7" />
        <Text style={styles.loadingText}>جاري تحميل السلة...</Text>
      </View>
    );
  }

  // حالة السلة الفارغة
  const isCartEmpty = !cart?.products || cart.products.length === 0;

  if (isCartEmpty) {
    return (
      <View style={styles.emptyContent}>
        {/* أيقونة السلة الفارغة */}
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
        </View>

        <Text style={styles.emptyTitle}>السلة فارغة</Text>
        <Text style={styles.emptySubtitle}>
          لم تقم بإضافة أي منتجات إلى السلة بعد
        </Text>

        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={handleContinueShopping}
          activeOpacity={0.8}
        >
          <Text style={styles.continueShoppingText}>ابدأ التسوق</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // حالة السلة بها منتجات
  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <View style={styles.cartContent}>
          {/* عنوان السلة */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>سلة التسوق</Text>
            <Text style={styles.itemCount}>
              {cart.products.length}{" "}
              {cart.products.length === 1 ? "منتج" : "منتجات"}
            </Text>
          </View>

          {/* قائمة المنتجات */}
          <FlatList
            data={cart.products}
            renderItem={({ item }) => (
              <CartItem
                isUpdating={isUpdating}
                item={item}
                deleteItem={deleteItem}
                increment={increment}
                decrement={decrement}
              />
            )}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>

        {/* زر الدفع */}
        <View style={{ marginBottom: 70 }}>
          <Chekout
            total={cart?.totalPrice}
            handleCheckout={handlePresentModalPress}
          />
        </View>

        {/* Bottom Sheet للـ Checkout */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          index={0}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <CheckOutModal
              handleClose={() => bottomSheetModalRef.current?.dismiss()}
            />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  // حالة التحميل
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8FF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  // حالة السلة الفارغة
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F8F8F8FF",
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  continueShoppingButton: {
    backgroundColor: "#30a1a7",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#30a1a7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueShoppingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  container: {
    marginTop: 20,
    flex: 1,
    backgroundColor: "#F8F8F8FF",
  },
  cartContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    paddingBottom: 20,
  },

  // Bottom Sheet styles
  bottomSheetBackground: {
    backgroundColor: "#ffffff",
  },
  bottomSheetIndicator: {
    backgroundColor: "#ccc",
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
});
