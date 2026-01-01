import { useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import ProductCard from '../components/Card';
import i18n from '@/utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';

export default function WishlistTab() {
  const { theme } = useTheme();
  const { wishlist, fetchWishlist, isLoading } = useWishlistStore();
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then(token => fetchWishlist(token));
  }, []);

  if (isLoading) return (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
    </View>
  );
  if (!wishlist.length) return (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.gray }]}>{i18n.t('wishlistEmpty')}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.veryLightGray }]}>{i18n.t('wishlistEmptySubtitle')}</Text>
    </View>
  );

  return (
    <View style={[{flex:1, marginBottom:40, backgroundColor: theme.colors.surface}]}>
    <FlatList
      data={wishlist}
      keyExtractor={item => item._id}
      numColumns={2}
      renderItem={({ item }) => <ProductCard item={item} />}
      contentContainerStyle={[styles.list, { backgroundColor: theme.colors.surface }]}
      columnWrapperStyle={styles.colomn}
      style={{ backgroundColor: theme.colors.surface }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
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