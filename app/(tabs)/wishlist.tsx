import { useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import ProductCard from '../components/Card';
import i18n from '@/utils/i18n';

export default function WishlistTab() {
  const { wishlist, fetchWishlist, isLoading } = useWishlistStore();
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then(token => fetchWishlist(token));
  }, []);

  if (isLoading) return <ActivityIndicator size="large" color="#f0b745" style={{ marginTop: 40 }} />;
  if (!wishlist.length) return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{i18n.t('wishlistEmpty')}</Text>
      <Text style={styles.emptySubtitle}>{i18n.t('wishlistEmptySubtitle')}</Text>
    </View>
  );

  return (
    <View style = {{flex:1, marginBottom:40}}>
    <FlatList
      data={wishlist}
      keyExtractor={item => item._id}
      numColumns={2}
      renderItem={({ item }) => <ProductCard item={item} />}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.colomn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    color: '#888',
  },
  list: {
    padding: 16,
    marginBottom:30
  },
  colomn:{
    margin:5,
    gap:10
  }
}); 