import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useCart } from '@/context/CartContext';

const CartPage = () => {
  const { items, removeItem, total, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg text-gray-500">Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-5">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center p-3 border-b border-gray-300">
            <Text className="text-lg font-bold">{item.name}</Text>
            <Text className="text-sm text-gray-500">${item.price.toFixed(2)}</Text>
            <Text className="text-sm text-gray-400">Qty: {item.quantity}</Text>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text className="text-red-500 text-sm">Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View className="mt-5 p-3 bg-gray-100 rounded-lg">
        <Text className="text-lg font-bold">Total Items: {itemCount}</Text>
        <Text className="text-lg font-bold text-green-600">Total Price: ${total.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default CartPage;