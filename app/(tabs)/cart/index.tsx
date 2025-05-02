import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import React from 'react';
import { useGlobalContext } from "@/providers/GlobalContext";

export default function Cart() {
  const { state, dispatch } = useGlobalContext();
  const { cart } = state;

  const handleRemoveFromCart = (id: any) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from the cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => dispatch({ type: "REMOVE_FROM_CART", payload: id }) },
      ]
    );
  };

  const handleUpdateQuantity = (id: any, action: "increment" | "decrement") => {
    dispatch({ type: "UPDATE_CART_QUANTITY", payload: { id, action } });
  };

  if (cart.length === 0) {
    return (
      <View style={styles.emptyCartContainer}>
        <Text style={styles.emptyCartText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cart.map((item) => (
        <View key={item.id} style={styles.cartItem}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{item.price} جـ.س</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, "decrement")}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, "increment")}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)}>
            <Text style={styles.removeButton}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  emptyCartContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyCartText: { fontSize: 18, color: "#888" },
  cartItem: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  itemImage: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "bold" },
  itemPrice: { fontSize: 14, color: "#888" },
  quantityContainer: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  quantityButton: { fontSize: 18, fontWeight: "bold", paddingHorizontal: 10 },
  quantityText: { fontSize: 16, marginHorizontal: 10 },
  removeButton: { color: "red", fontSize: 14 },
});