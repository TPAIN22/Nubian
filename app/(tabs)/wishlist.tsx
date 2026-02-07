import { useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useWishlistItems, useWishlistLoading, useWishlistActions } from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import ProductCard from "@/components/Card";
import i18n from '@/utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { normalizeProduct, type NormalizedProduct } from "@/domain/product/product.normalize";

export default function WishlistTab() {
  const { theme } = useTheme();
  // Use optimized selectors
  const wishlist = useWishlistItems();
  const isLoading = useWishlistLoading();
  const { fetchWishlist } = useWishlistActions();
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then(token => fetchWishlist(token));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount, not on every function reference change

  // PERFORMANCE: Memoize normalized products to avoid re-normalizing on every render
  const normalizedWishlist = useMemo(() => {
    return wishlist.map((item: any) => normalizeProduct(item));
  }, [wishlist]);

  // PERFORMANCE: Memoize renderItem to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }: { item: NormalizedProduct }) => (
    <ProductCard item={item} />
  ), []);

  // PERFORMANCE: Stable keyExtractor
  const keyExtractor = useCallback((item: NormalizedProduct) => item.id, []);

  if (isLoading) return (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
    </View>
  );
  if (!normalizedWishlist.length) return (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text.gray }]}>{i18n.t('wishlistEmpty')}</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.veryLightGray }]}>{i18n.t('wishlistEmptySubtitle')}</Text>
    </View>
  );

  return (
    <View style={[{ flex: 1, marginBottom: 40, backgroundColor: theme.colors.surface }]}>
      <FlatList
        data={normalizedWishlist}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { backgroundColor: theme.colors.surface }]}
        columnWrapperStyle={styles.colomn}
        style={{ backgroundColor: theme.colors.surface }}
        // PERFORMANCE: FlatList optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={6}
        initialNumToRender={6}
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
    marginBottom: 30
  },
  colomn: {
    margin: 5,
    gap: 10
  }
}); 