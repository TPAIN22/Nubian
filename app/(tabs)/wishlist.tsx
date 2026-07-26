import { useEffect, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWishlistItems, useWishlistLoading, useWishlistActions } from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import ProductCard from "@/components/Card";
import i18n from '@/utils/i18n';
import { normalizeProduct, type NormalizedProduct } from "@/domain/product/product.normalize";
import { EmptyState, Screen, SkeletonProductCard } from '@/components/ui/kit';
import { SCREEN_PADDING, spacing } from '@/theme/tokens';

/** Two-column grid: matches the catalogue grid on every other screen. */
const COLUMNS = 2;

export default function WishlistTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const listContentStyle = useMemo(
    () => [styles.list, { paddingBottom: insets.bottom + spacing.huge }],
    [insets.bottom],
  );

  // A skeleton grid rather than a centred spinner: the customer sees the shape
  // of what's coming, and the screen doesn't jump from empty → full.
  if (isLoading) {
    return (
      <Screen>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={styles.skeletonCell}>
              <SkeletonProductCard />
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  if (!normalizedWishlist.length) {
    return (
      <Screen>
        <EmptyState
          fullHeight
          icon="heart-outline"
          title={i18n.t('wishlistEmpty')}
          description={i18n.t('wishlistEmptySubtitle')}
          actionLabel={i18n.t('startShopping') || i18n.t('home')}
          onAction={() => router.push('/(tabs)' as any)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={normalizedWishlist}
        keyExtractor={keyExtractor}
        numColumns={COLUMNS}
        renderItem={renderItem}
        contentContainerStyle={listContentStyle}
        columnWrapperStyle={styles.column}
        // PERFORMANCE: FlatList optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={6}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: SCREEN_PADDING,
    // The row gap; `column` carries the gutter between the two cards.
    gap: spacing.md,
  },
  column: {
    gap: spacing.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SCREEN_PADDING,
    gap: spacing.md,
  },
  // Fixed 48% so the two placeholder columns line up with the real grid.
  skeletonCell: { width: '48%' },
});
