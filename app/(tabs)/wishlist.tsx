import React, { useEffect } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import ProductCard from '../components/Card';

export default function WishlistTab() {
  const { wishlist, fetchWishlist, isLoading } = useWishlistStore();
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then(token => fetchWishlist(token));
  }, []);

  if (isLoading) return <ActivityIndicator size="large" color="#30a1a7" style={{ marginTop: 40 }} />;
  if (!wishlist.length) return <Text style={styles.emptyText}>لا توجد منتجات في المفضلة</Text>;

  return (
    <FlatList
      data={wishlist}
      keyExtractor={item => item._id}
      renderItem={({ item }) => <ProductCard item={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    color: '#888',
  },
  list: {
    padding: 16,
  },
}); 