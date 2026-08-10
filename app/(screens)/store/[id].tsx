import {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  useWindowDimensions,
  InteractionManager,
  ActivityIndicator,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AppText,
  EmptyState,
  Rating,
  Screen,
  SkeletonBlock,
  SkeletonProductCard,
  Surface,
  Touchable,
} from '@/components/ui/kit';
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
import i18n from '@/utils/i18n';
import { resolveStoreCover, storeGradient } from '@/utils/storeCover';
import axiosInstance from '@/services/api/client';
import ProductCard from '@/components/ProductCard';
import { normalizeProduct } from '@/domain/product/product.normalize';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useTracking } from '@/hooks/useTracking';
import type { NormalizedProduct } from '@/domain/product/product.normalize';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Merchant {
  _id: string;
  storeName: string;
  logoUrl?: string | null;
  banner?: string | null;
  rating?: number;
  totalReviews?: number;
  description?: string;
  status?: string;
  verified?: boolean;
  categories?: string[];
  city?: string;
  merchantType?: string;
}

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

type Tab = 'products' | 'reviews' | 'about';

// ─── Layout constants ─────────────────────────────────────────────────────────

const LOGO_SIZE = 84;
const LOGO_RING = 3;
const TAB_H = 48;
const STICKY_NAV_H = 52;
const PAGE_SIZE = 20;
const CARD_GAP = layout.gridGap;
const H_PAD = SCREEN_PADDING;

// ─── StarRow ──────────────────────────────────────────────────────────────────

/**
 * Five discrete stars. The kit's `Rating` pill is the right call for a score in
 * a dense row (hero, product card); an individual review is the one place the
 * whole scale should be visible, because the reader is judging *this* rating.
 */
const StarRow = memo(({ rating, size = iconSize.xs }: { rating: number; size?: number }) => {
  const colors = useColors();
  return (
    <View style={starStyles.row} accessibilityLabel={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.rating}
        />
      ))}
    </View>
  );
});
StarRow.displayName = 'StarRow';

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xxs },
});

// ─── ReviewCard ───────────────────────────────────────────────────────────────

const ReviewCard = memo(({ review }: { review: Review }) => {
  const colors = useColors();

  const date = useMemo(
    () =>
      new Date(review.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [review.createdAt]
  );

  const initial = review.userName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Surface level="xs" padding="lg" style={reviewStyles.card}>
      <View style={reviewStyles.head}>
        <View style={[reviewStyles.avatar, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
          <AppText variant="subtitle" weight="700" tone="primary">
            {initial}
          </AppText>
        </View>

        <View style={reviewStyles.identity}>
          <AppText variant="bodySmallStrong" tone="title" numberOfLines={1}>
            {review.userName}
          </AppText>
          <StarRow rating={review.rating} />
        </View>

        <AppText variant="micro" tone="subtle">
          {date}
        </AppText>
      </View>

      {review.comment ? (
        <AppText variant="bodySmall" tone="body" style={reviewStyles.comment}>
          {review.comment}
        </AppText>
      ) : null}
    </Surface>
  );
});
ReviewCard.displayName = 'ReviewCard';

const reviewStyles = StyleSheet.create({
  card: { marginHorizontal: H_PAD, marginBottom: spacing.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: spacing.xs },
  comment: { marginTop: spacing.md },
});

// ─── TabBar ───────────────────────────────────────────────────────────────────

const TABS: { key: Tab; labelKey: string; fallback: string }[] = [
  { key: 'products', labelKey: 'products', fallback: 'Products' },
  { key: 'reviews', labelKey: 'reviews', fallback: 'Reviews' },
  { key: 'about', labelKey: 'store_about', fallback: 'About' },
];

const TabBar = memo(
  ({ activeTab, onChange }: { activeTab: Tab; onChange: (t: Tab) => void }) => {
    const colors = useColors();

    return (
      <View
        style={[
          tabStyles.wrap,
          { backgroundColor: colors.surface, borderBottomColor: colors.borderLight },
        ]}
      >
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Touchable
              key={t.key}
              style={tabStyles.tab}
              scaleTo={1}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText
                variant="bodySmall"
                weight={active ? '700' : '500'}
                style={{ color: active ? colors.primary : colors.text.muted }}
              >
                {String(i18n.t(t.labelKey) || t.fallback)}
              </AppText>
              {active ? (
                <View style={[tabStyles.indicator, { backgroundColor: colors.primary }]} />
              ) : null}
            </Touchable>
          );
        })}
      </View>
    );
  }
);
TabBar.displayName = 'TabBar';

const tabStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    height: TAB_H,
    paddingHorizontal: H_PAD,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '56%',
    borderTopStartRadius: radius.xs,
    borderTopEndRadius: radius.xs,
  },
});

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero = memo(({ merchant, bannerH }: { merchant: Merchant | null; bannerH: number }) => {
  const colors = useColors();
  const rating = merchant?.rating ?? 0;
  const reviews = merchant?.totalReviews ?? 0;
  const verified = merchant?.status === 'approved' || merchant?.verified;

  // Every store gets a cover — uploaded, derived from the logo, or generated.
  // See `utils/storeCover` for why an empty hero is not an option.
  const cover = useMemo(() => (merchant ? resolveStoreCover(merchant) : null), [merchant]);

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <View style={[heroStyles.banner, { height: bannerH, backgroundColor: colors.surfaceMuted }]}>
        {cover?.kind === 'image' ? (
          <Image
            source={{ uri: cover.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={320}
          />
        ) : cover?.kind === 'blurred' ? (
          <>
            <Image
              source={{ uri: cover.uri }}
              style={StyleSheet.absoluteFill}
              // Cropped and heavily blurred on purpose: this is the logo used as
              // a colour field, not as a readable mark — the sharp copy sits in
              // the ring directly below.
              contentFit="cover"
              blurRadius={40}
              transition={320}
            />
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha('#000000', 0.15) }]}
              pointerEvents="none"
            />
          </>
        ) : (
          <LinearGradient
            colors={cover?.colors ?? storeGradient('')}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, heroStyles.center]}
          >
            <Ionicons
              name="storefront-outline"
              size={iconSize.hero}
              color={withAlpha('#FFFFFF', 0.9)}
            />
          </LinearGradient>
        )}

        {/* Bottom scrim only — a flat wash over the whole banner is what made
            store art look muddy; this just protects the logo's edge. */}
        <LinearGradient
          colors={['transparent', colors.scrim]}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={heroStyles.info}>
        <View
          style={[
            heroStyles.logoRing,
            { backgroundColor: colors.surface, borderColor: colors.surface },
            elevation.md,
          ]}
        >
          {merchant?.logoUrl ? (
            <Image
              source={{ uri: merchant.logoUrl }}
              style={heroStyles.logo}
              contentFit="cover"
              transition={280}
            />
          ) : (
            <View
              style={[
                heroStyles.logo,
                heroStyles.center,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons name="storefront" size={iconSize.xxl} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={heroStyles.nameRow}>
          <AppText variant="title" tone="title" numberOfLines={1} style={heroStyles.name}>
            {merchant?.storeName ?? ''}
          </AppText>
          {verified ? (
            <Ionicons name="checkmark-circle" size={iconSize.md} color={colors.primary} />
          ) : null}
        </View>

        {rating > 0 ? <Rating value={rating} count={reviews || undefined} /> : null}
      </View>
    </View>
  );
});
Hero.displayName = 'Hero';

const heroStyles = StyleSheet.create({
  banner: { width: '100%', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  info: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  logoRing: {
    width: LOGO_SIZE + LOGO_RING * 2,
    height: LOGO_SIZE + LOGO_RING * 2,
    borderRadius: radius.pill,
    borderWidth: LOGO_RING,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(LOGO_SIZE / 2 + LOGO_RING),
    marginBottom: spacing.sm,
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: radius.pill },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1, textAlign: 'center' },
});

// ─── Skeletons ────────────────────────────────────────────────────────────────

const StoreSkeleton = memo(({ bannerH, cardW }: { bannerH: number; cardW: number }) => {
  const colors = useColors();
  return (
    <View accessibilityLabel={String(i18n.t('loading') || 'Loading')}>
      <View style={{ backgroundColor: colors.surface }}>
        <SkeletonBlock height={bannerH} rounded={radius.none} />
        <View style={skeletonStyles.hero}>
          <SkeletonBlock
            height={LOGO_SIZE + LOGO_RING * 2}
            width={LOGO_SIZE + LOGO_RING * 2}
            rounded={radius.pill}
            style={skeletonStyles.logo}
          />
          <SkeletonBlock height={22} width={168} />
          <SkeletonBlock height={16} width={104} />
        </View>
        <View style={skeletonStyles.tabs}>
          {[76, 68, 60].map((w) => (
            <SkeletonBlock key={w} height={18} width={w} />
          ))}
        </View>
      </View>

      <View style={skeletonStyles.grid}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonProductCard key={i} width={cardW} />
        ))}
      </View>
    </View>
  );
});
StoreSkeleton.displayName = 'StoreSkeleton';

const skeletonStyles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  logo: { marginTop: -(LOGO_SIZE / 2 + LOGO_RING), marginBottom: spacing.sm },
  tabs: {
    height: TAB_H,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
    paddingTop: spacing.lg,
  },
});

// ─── About ────────────────────────────────────────────────────────────────────

const About = memo(({ merchant }: { merchant: Merchant | null }) => {
  const description = merchant?.description?.trim();

  return (
    <Surface padding="xl" style={aboutStyles.card}>
      <AppText variant="subtitle" tone="title">
        {String(i18n.t('store_about') || 'About')}
      </AppText>
      <AppText
        variant="body"
        tone={description ? 'body' : 'muted'}
        style={aboutStyles.body}
      >
        {description || String(i18n.t('store_noDescription') || 'No description provided.')}
      </AppText>
    </Surface>
  );
});
About.displayName = 'About';

const aboutStyles = StyleSheet.create({
  card: { margin: H_PAD },
  body: { marginTop: spacing.md },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useColors();
  const rtl = useRTL();
  const { trackEvent } = useTracking();
  const currencyCode = useCurrencyStore((s) => s.currencyCode);

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  const BANNER_H = Math.round(width / layout.bannerRatio);
  const CARD_W = (width - H_PAD * 2 - CARD_GAP) / 2;

  // The point at which the inline tab bar has scrolled away and the sticky one
  // must take over. Measured rather than guessed: the hero's height depends on
  // whether the store has a rating and how the name wraps, so a hard-coded
  // estimate desyncs the handoff and the tabs flicker mid-scroll.
  const [headerH, setHeaderH] = useState(0);
  const HERO_H = (headerH || BANNER_H + LOGO_SIZE + spacing.huge) - insets.top - STICKY_NAV_H - TAB_H;

  // ── Sticky animations ──────────────────────────────────────────────────────
  const navOpacity = scrollY.interpolate({
    inputRange: [BANNER_H - 72, BANNER_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const stickyTabY = scrollY.interpolate({
    inputRange: [HERO_H - 16, HERO_H + 16],
    outputRange: [-TAB_H, 0],
    extrapolate: 'clamp',
  });
  const stickyTabOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 16, HERO_H + 16],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchMerchant = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/merchants/store/${id}`);
      const data = res.data?.data ?? res.data;
      setMerchant(data ?? null);
    } catch {
      /* the products call owns the error state — a missing hero isn't fatal */
    }
  }, [id]);

  const fetchProducts = useCallback(
    async (pg = 1) => {
      if (!id) return;
      try {
        if (pg === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const res = await axiosInstance.get(`/merchants/store/${id}/products`, {
          params: { page: pg, limit: PAGE_SIZE, currencyCode },
        });

        const raw = res.data;
        let items: any[] = [];
        if (Array.isArray(raw?.data)) items = raw.data;
        else if (Array.isArray(raw?.products)) items = raw.products;
        else if (Array.isArray(raw)) items = raw;

        const normalized = items
          .map((p) => {
            try {
              return normalizeProduct(p);
            } catch {
              return p as NormalizedProduct;
            }
          })
          .filter(Boolean) as NormalizedProduct[];

        setProducts((prev) => (pg === 1 ? normalized : [...prev, ...normalized]));
        setError(null);

        // `sendPaginated` nests the count under `meta.pagination.total`. Reading
        // `meta.total` always missed and fell through to `normalized.length`,
        // which makes a full page look like the last page — the store stopped
        // at 20 products no matter how many it had.
        const total =
          (raw as any)?.meta?.pagination?.total ??
          (res as any)?.meta?.pagination?.total ??
          (raw as any)?.total;
        setHasMore(
          typeof total === 'number' ? pg * PAGE_SIZE < total : normalized.length === PAGE_SIZE
        );
        setPage(pg);
      } catch {
        setError('load-failed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [id, currencyCode]
  );

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axiosInstance.get(`/merchants/store/${id}/reviews`, {
        params: { limit: 30 },
      });
      const data = res.data?.data ?? res.data ?? [];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      /* reviews are supplementary — never block the storefront on them */
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchMerchant(), fetchProducts(1), fetchReviews()]).finally(() =>
      setIsLoading(false)
    );
    InteractionManager.runAfterInteractions(() => {
      trackEvent('store_open', { storeId: id as string, screen: 'merchant_details' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([fetchMerchant(), fetchProducts(1), fetchReviews()]);
  }, [fetchMerchant, fetchProducts, fetchReviews]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) fetchProducts(page + 1);
  }, [isLoadingMore, hasMore, page, fetchProducts]);

  const handleTabChange = useCallback(
    (t: Tab) => {
      setActiveTab(t);
      scrollY.setValue(0);
    },
    [scrollY]
  );

  // ── Render helpers ─────────────────────────────────────────────────────────
  const handleHeaderLayout = useCallback(
    (e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height),
    []
  );

  const ListHeader = useMemo(
    () => (
      <View onLayout={handleHeaderLayout}>
        <Hero merchant={merchant} bannerH={BANNER_H} />
        <TabBar activeTab={activeTab} onChange={handleTabChange} />
      </View>
    ),
    [merchant, BANNER_H, activeTab, handleTabChange, handleHeaderLayout]
  );

  const renderProduct = useCallback(
    ({ item }: { item: NormalizedProduct }) => (
      <View style={{ width: CARD_W }}>
        <ProductCard item={item} variant="grid" />
      </View>
    ),
    [CARD_W]
  );

  const renderReview = useCallback(({ item }: { item: Review }) => <ReviewCard review={item} />, []);

  const keyProduct = useCallback((item: NormalizedProduct) => item.id, []);
  const keyReview = useCallback((item: Review) => item._id, []);

  const scrollHandler = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        // Sticky nav/tab animations are pure opacity + translateY, so they run
        // entirely on the UI thread — no bridge round-trip per scroll frame.
        useNativeDriver: true,
      }),
    [scrollY]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        colors={[colors.primary]}
        tintColor={colors.primary}
      />
    ),
    [isRefreshing, handleRefresh, colors.primary]
  );

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

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading && products.length === 0) {
    return (
      <Screen>
        {backButton}
        <StoreSkeleton bannerH={BANNER_H} cardW={CARD_W} />
      </Screen>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !merchant) {
    return (
      <Screen>
        {backButton}
        <EmptyState
          fullHeight
          tone="error"
          icon="alert-circle-outline"
          title={String(i18n.t('store_loadFailed') || 'Could not load this store')}
          description={String(i18n.t('store_loadFailedHint') || 'Check your connection and try again.')}
          actionLabel={String(i18n.t('retry') || 'Retry')}
          onAction={handleRefresh}
        />
      </Screen>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return (
    <Screen>
      {backButton}

      {/* Collapsing nav — the store name takes over once the banner scrolls off. */}
      <Animated.View
        style={[
          styles.stickyNav,
          {
            opacity: navOpacity,
            backgroundColor: colors.surface,
            paddingTop: insets.top,
            borderBottomColor: colors.borderLight,
          },
        ]}
        pointerEvents="none"
      >
        <AppText variant="bodySmallStrong" weight="700" tone="title" numberOfLines={1}>
          {merchant?.storeName ?? ''}
        </AppText>
      </Animated.View>

      {/* Sticky tabs — slide in as the inline tab bar scrolls away. */}
      <Animated.View
        style={[
          styles.stickyTabs,
          {
            top: insets.top + STICKY_NAV_H,
            opacity: stickyTabOpacity,
            transform: [{ translateY: stickyTabY }],
          },
        ]}
      >
        <TabBar activeTab={activeTab} onChange={handleTabChange} />
      </Animated.View>

      {activeTab === 'products' && (
        <Animated.FlatList<NormalizedProduct>
          data={products}
          numColumns={2}
          keyExtractor={keyProduct}
          renderItem={renderProduct}
          // Gutters live on the column wrapper, not the content container, so
          // the hero banner stays full-bleed instead of being inset by 12pt.
          columnWrapperStyle={styles.column}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={String(i18n.t('store_noProducts') || 'No products yet')}
              description={String(
                i18n.t('store_noProductsHint') || "This store hasn't listed anything for sale."
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
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
        />
      )}

      {activeTab === 'reviews' && (
        <Animated.FlatList<Review>
          data={reviews}
          keyExtractor={keyReview}
          renderItem={renderReview}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
          ListHeaderComponent={ListHeader}
          ListHeaderComponentStyle={styles.listHeaderGap}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title={String(i18n.t('store_noReviews') || 'No reviews yet')}
              description={String(
                i18n.t('store_noReviewsHint') ||
                  "Reviews appear here once shoppers rate this store's products."
              )}
            />
          }
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
        />
      )}

      {activeTab === 'about' && (
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
        >
          {ListHeader}
          <About merchant={merchant} />
        </Animated.ScrollView>
      )}
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backSlot: {
    position: 'absolute',
    start: H_PAD,
    zIndex: 200,
  },
  backButton: {
    width: MIN_TOUCH - spacing.xs,
    height: MIN_TOUCH - spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stickyNav: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 100,
    height: STICKY_NAV_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.md,
    paddingHorizontal: MIN_TOUCH + H_PAD,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  stickyTabs: {
    position: 'absolute',
    start: 0,
    end: 0,
    zIndex: 99,
  },

  column: {
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
    marginTop: CARD_GAP,
  },

  listHeaderGap: { marginBottom: spacing.md },

  loadMore: { paddingVertical: spacing.xxl, alignItems: 'center' },
});
