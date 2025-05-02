import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { useGlobalContext } from "@/providers/GlobalContext";

export default function Cart() {
  const { state, dispatch } = useGlobalContext();
  const { cart } = state;

  const handleRemoveFromCart = (id: any) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: id });
  };

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {cart.map((item) => (
        <View key={item.id} style={{ flexDirection: "row", marginBottom: 10 }}>
          <Text style={{ flex: 1 }}>{item.name}</Text>
          <Text style={{ flex: 1 }}>{item.price} جـ.س</Text>
          <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)}>
            <Text style={{ color: "red" }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}