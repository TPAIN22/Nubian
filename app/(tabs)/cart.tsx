import { View, Text, ActivityIndicator, FlatList } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import useCartStore from '@/store/useCartStore';
import { useAuth } from '@clerk/clerk-expo';
import CartItem from '../components/cartItem';

export default function cart() {
  const { getCart , cartItems , isCartLoading , updateCartItem , removeFromCart} = useCartStore();
  const { getToken } = useAuth();
  useEffect(() => {
    const featchCart = async () => {
      const token = await getToken();
      if (token) {
       await getCart(token);
      }
    }
    featchCart();
  }, [])

  const increment = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await updateCartItem(item.product, token, 1);
    }
  }, [])

  const decrement = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await updateCartItem(item.product, token, -1);
    }
  }, [])

  const deleteItem = useCallback(async (item: any) => {
    const token = await getToken();
    if (token) {
      await removeFromCart(item.product._id, token);

    }
  }, [])

  if (isCartLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e98c22" />
      </View>
    )
  }
  return (
    <View style={{ flex: 1 , justifyContent: 'space-between', marginBottom: 70}}>  
      <View>
      <FlatList
        data={cartItems}
        renderItem={({ item }) => (
          <CartItem item={item} deleteItem={deleteItem} increment={increment} decrement={decrement} />
        )}
        keyExtractor={(item) => item._id}
        />
        </View>
        <View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#e98c22', margin: 10 }}>المجموع: {cartItems.reduce((total: number, item: any) => total + item.quantity * item.product.price, 0)}</Text>
        </View>
    </View>
  )
}