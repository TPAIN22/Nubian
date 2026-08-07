import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  AppText,
  EmptyState,
  Screen,
  SkeletonBlock,
  SkeletonProductCard,
  Touchable,
} from '@/components/ui/kit';
import ProductCard from '@/components/ProductCard';
import {
  elevation,
  iconSize,
  layout,
  MIN_TOUCH,
  radius,
  SCREEN_PADDING,
  spacing,
  withAlpha,
} from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';
import { useRTL } from '@/hooks/useRTL';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTracking } from '@/hooks/useTracking';
import i18n from '@/utils/i18n';
import { getCollection, type CollectionDetails } from '@/api/collection.api';
import { normalizeProduct, type NormalizedProduct } from '@/domain/product/product.normalize';

/**
 * Collection screen — Banner → Collection → Products.
 *
 * Its own route rather than a mode of `(screens)/[id]`, which is the Category
 * screen: sharing that segment would make `/(screens)/<objectid>` ambiguous
 * between a category and a collection, and the router would resolve it by
 * whichever id happened to match first.
 *
 * The product grid is the shared `ProductCard`, so a collection product looks
 * and behaves exactly like the same product in search or on a category page.
 */

const PAGE_SIZE = 20;
const CARD_GAP = layout.gridGap;
const H_PAD = SCREEN_PADDING;

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useColors();
  const rtl = useRTL();
  const { trackEvent } = useTracking();
  const currencyCode = useCurrencyStore((s) => s.currencyCode);

  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<'not-found' | 'load-failed' | null>(null);

  const HERO_H = Math.round(width / layout.bannerRatio);
  const CARD_W = (width - H_PAD * 2 - CARD_GAP) / 2;

  const load = useCallback(
    async (pg: number) => {
      if (!id) return;
      if (pg === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const result = await getCollection(id, pg, PAGE_SIZE, currencyCode);

        const normalized = result.collection.products
          .map((p) => {
            try {
              return normalizeProduct(p);
            } catch {
              // One malformed product must not take the whole collection down.
              return null;
            }
          })
          .filter(Boolean) as NormalizedProduct[];

        setCollection(result.collection);
        setProducts((prev) => (pg === 1 ? normalized : [...prev, ...normalized]));
        setPage(result.page);
        setTotalPages(result.totalPages);
        setError(null);
      } catch (e) {
        // An inactive or deleted collection is a 404 from the public endpoint —
        // which is exactly what a banner pointing at a taken-down collection
        // hits, so it gets its own message rather than "check your connection".
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (pg === 1) setError(status === 404 ? 'not-found' : 'load-failed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [id, currencyCode],
  );

  useEffect(() => {
    load(1);
    trackEvent('collection_open', { collectionId: String(id), screen: 'collection' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currencyCode]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    load(1);
  }, [load]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading || page >= totalPages) return;
    load(page + 1);
  }, [isLoadingMore, isLoading, page, totalPages, load]);

  const renderProduct = useCallback(
    ({ item }: { item: NormalizedProduct }) => (
      <View style={{ width: CARD_W }}>
        <ProductCard item={item} variant="grid" cardWidth={CARD_W} />
      </View>
    ),
    [CARD_W],
  );

  const keyExtractor = useCallback((item: NormalizedProduct) => item.id, []);

  const backButton = (
    <View style={[styles.backSlot, { top: insets.top + spacing.sm }]}>
      <Touchable
        onPress={() => router.back()}
        hitSlop={spacing.sm}
        style={[styles.backButton, { backgroundColor: colors.surface }, elevation.sm]}
        accessibilityRole="button"
        accessibilityLabel={String(i18n.t('back') || 'Back')}
      >
        <Ionicons name={rtl.arrowBack} size={iconSize.md} color={colors.text.title} />
      </Touchable>
    </View>
  );

  const header = useMemo(
    () => (
      <View style={{ backgroundColor: colors.surface }}>
        <View style={[styles.hero, { height: HERO_H, backgroundColor: colors.surfaceMuted }]}>
          {collection?.image ? (
            <Image
              source={{ uri: collection.image }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={320}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.center,
                { backgroundColor: withAlpha(colors.primary, 0.1) },
              ]}
            >
              <Ionicons name="albums-outline" size={iconSize.hero} color={colors.primary} />
            </View>
          )}

          {/* Bottom scrim only, matching the store hero — enough to protect the
              title's edge without washing out the artwork. */}
          <LinearGradient
            colors={['transparent', colors.scrim]}
            locations={[0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        <View style={styles.info}>
          <AppText variant="title" tone="title" numberOfLines={2}>
            {collection?.name ?? ''}
          </AppText>

          {collection?.description ? (
            <AppText variant="bodySmall" tone="body" style={styles.description}>
              {collection.description}
            </AppText>
          ) : null}

          <AppText variant="micro" tone="subtle">
            {`${collection?.productCount ?? products.length} ${String(
              i18n.t('products') || 'Products',
            )}`}
          </AppText>
        </View>
      </View>
    ),
    [collection, colors, HERO_H, products.length],
  );

  /* -- Loading -------------------------------------------------------------- */
  if (isLoading && !collection) {
    return (
      <Screen>
        {backButton}
        <View accessibilityLabel={String(i18n.t('loading') || 'Loading')}>
          <SkeletonBlock height={HERO_H} rounded={radius.none} />
          <View style={styles.skeletonInfo}>
            <SkeletonBlock height={22} width={200} />
            <SkeletonBlock height={16} width={260} />
          </View>
          <View style={styles.skeletonGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonProductCard key={i} width={CARD_W} />
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  /* -- Error ---------------------------------------------------------------- */
  if (error && !collection) {
    const notFound = error === 'not-found';
    return (
      <Screen>
        {backButton}
        <EmptyState
          fullHeight
          tone={notFound ? 'neutral' : 'error'}
          icon={notFound ? 'albums-outline' : 'alert-circle-outline'}
          title={String(
            notFound
              ? i18n.t('collection_unavailable') || 'This collection is no longer available'
              : i18n.t('collection_loadFailed') || 'Could not load this collection',
          )}
          description={String(
            notFound
              ? i18n.t('collection_unavailableHint') || 'It may have been removed or hidden.'
              : i18n.t('collection_loadFailedHint') || 'Check your connection and try again.',
          )}
          actionLabel={notFound ? undefined : String(i18n.t('retry') || 'Retry')}
          onAction={notFound ? undefined : handleRefresh}
        />
      </Screen>
    );
  }

  /* -- Content -------------------------------------------------------------- */
  return (
    <Screen>
      {backButton}
      <FlatList<NormalizedProduct>
        data={products}
        numColumns={2}
        keyExtractor={keyExtractor}
        renderItem={renderProduct}
        // Gutters live on the column wrapper so the hero stays full-bleed.
        columnWrapperStyle={styles.column}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          // A collection with nothing available is a valid collection: the hero
          // still renders and this replaces the grid.
          <EmptyState
            icon="cube-outline"
            title={String(i18n.t('collection_empty') || 'Nothing here yet')}
            description={String(
              i18n.t('collection_emptyHint') ||
                'The products in this collection are not available right now.',
            )}
          />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMore}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  backSlot: { position: 'absolute', start: H_PAD, zIndex: 200 },
  backButton: {
    width: MIN_TOUCH - spacing.xs,
    height: MIN_TOUCH - spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { width: '100%', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  info: {
    paddingHorizontal: H_PAD,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  description: { marginBottom: spacing.xxs },

  skeletonInfo: { paddingHorizontal: H_PAD, paddingVertical: spacing.lg, gap: spacing.sm },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
  },

  column: { gap: CARD_GAP, paddingHorizontal: H_PAD, marginTop: CARD_GAP },
  loadMore: { paddingVertical: spacing.xxl, alignItems: 'center' },
});
