import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Devider from "@/app/components/Devider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Image } from "expo-image";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef } from "react";
import useCartStore from "@/store/useCartStore";

const CartPage = () => {
  const {
    getCart,
    cartItems,
    totalQuantity,
    totalPrice,
  } = useCartStore();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
    const { getToken } = useAuth();
  const cart = async () => {
      const token = await getToken();
      console.log(token);
      await getCart(token);
    }

  useEffect(() => {
    cart();
  }, []);
  console.log("Rendering", cartItems);

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: "#FFFFFFFF",
          },
          headerLeft: () => (
            <Ionicons name="cart-outline" size={24} color="#555958FF" />
          ),
          headerTransparent: true,
          headerTitleAlign: "center",
          title: "السلة",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
        }}
      />
      <View style={{ ...styles.centered, marginTop: headerHeight }}>
        <FlatList
          data={cartItems}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.product.image }} style={styles.image} />
              <View>
                <Text style={styles.name}>{item.product.name}</Text>
                <Text style={styles.price}>{item.product.price} SDG</Text>
                <View style={styles.quantityContainer}>
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color="#A37D2C8A"
                    onPress={() => {}}
                  />
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color="#A37D2C8A"
                    onPress={() => {}}
                  />
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item._id}
        />
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F6ECFF",
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    backgroundColor: "#fff",
  },
  loginButton: {
    width: 200,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row",
    backgroundColor: "#9B7931DC",
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
  },
  emptyCartText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  cartActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 80,
  },
  continueShoppingButton: {
    backgroundColor: "#006348",
    padding: 8,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  checkoutButton: {
    backgroundColor: "#A37E2C",
    padding: 8,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#006348",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 18,
    color: "#006348",
  },
  summaryValue: {
    fontSize: 18,
    color: "#006348",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  paymentMethodLabel: {
    fontSize: 18,
    color: "#006348",
  },
  paymentMethodValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentMethodText: {
    fontSize: 18,
    color: "#006348",
  },
  confirmOrderButton: {
    backgroundColor: "#006348",
    padding: 4,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 64,
  },
  confirmOrderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
});

export default CartPage;
