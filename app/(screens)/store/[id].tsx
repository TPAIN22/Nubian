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
  Pressable,
  RefreshControl,
  useWindowDimensions,
  InteractionManager,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Skeleton } from 'moti/skeleton';
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

// ─── Layout constants ──────────────────────────────────────────────────────────

const BANNER_H = 230;
const LOGO_SIZE = 80;
const HERO_H = BANNER_H + 124; // banner + name/stats row
const TAB_H = 52;
const STICKY_NAV_H = 56;
const CARD_GAP = 12;
const H_PAD = 16;

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = memo(
  ({ rating, size = 13, color }: { rating: number; size?: number; color: string }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={rating >= i ? 'star' : rating >= i - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={color}
        />
      ))}
    </View>
  )
);
StarRating.displayName = 'StarRating';

// ─── ReviewCard ───────────────────────────────────────────────────────────────

const ReviewCard = memo(({ review, colors }: { review: Review; colors: any }) => {
  const date = useMemo(
    () =>
      new Date(review.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [review.createdAt]
  );

  const initial = review.userName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View style={[rc.card, { backgroundColor: colors.cardBackground }]}>
      <View style={rc.row}>
        <View style={[rc.avatar, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[rc.initial, { color: colors.primary }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[rc.name, { color: colors.text.gray }]}>{review.userName}</Text>
          <StarRating rating={review.rating} color={colors.warning} />
        </View>
        <Text style={[rc.date, { color: colors.text.veryLightGray }]}>{date}</Text>
      </View>
      {!!review.comment && (
        <Text style={[rc.comment, { color: colors.text.mediumGray }]}>{review.comment}</Text>
      )}
    </View>
  );
});
ReviewCard.displayName = 'ReviewCard';

const rc = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: H_PAD,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 1 },
    }),
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 16, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 11, marginTop: 2 },
  comment: { fontSize: 14, lineHeight: 20 },
});

// ─── TabBar content ───────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'products', label: 'Products' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'about', label: 'About' },
];

const TabBarContent = memo(
  ({
    activeTab,
    onChange,
    colors,
  }: {
    activeTab: Tab;
    onChange: (t: Tab) => void;
    colors: any;
  }) => (
    <View style={[tbs.wrap, { backgroundColor: colors.background }]}>
      {TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <Pressable
            key={t.key}
            style={tbs.tab}
            onPress={() => onChange(t.key)}
            hitSlop={6}
          >
            <Text
              style={[
                tbs.label,
                { color: active ? colors.primary : colors.text.veryLightGray },
              ]}
            >
              {t.label}
            </Text>
            {active && (
              <View style={[tbs.indicator, { backgroundColor: colors.primary }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  )
);
TabBarContent.displayName = 'TabBarContent';

const tbs = StyleSheet.create({
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
    paddingTop: 4,
    position: 'relative',
  },
  label: { fontSize: 14, fontWeight: '600' },
  indicator: { position: 'absolute', bottom: 0, height: 2.5, width: '60%', borderRadius: 2 },
});

// ─── HeroSection ─────────────────────────────────────────────────────────────

const HeroSection = memo(
  ({
    merchant,
    colors,
    isDark,
  }: {
    merchant: Merchant | null;
    colors: any;
    isDark: boolean;
  }) => {
    const rating = merchant?.rating ?? 0;
    const reviews = merchant?.totalReviews ?? 0;

    return (
      <View>
        {/* Banner */}
        <View style={[hs.bannerWrap, { height: BANNER_H }]}>
          {merchant?.banner ? (
            <Image
              source={{ uri: merchant.banner }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={400}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? colors.surface : colors.primary + '22' },
              ]}
            />
          )}
          {/* Gradient overlay */}
          <View style={hs.bannerOverlay} />
        </View>

        {/* Logo + info */}
        <View style={[hs.infoWrap, { backgroundColor: colors.background }]}>
          {/* Logo overlapping banner */}
          <View style={hs.logoOuter}>
            <View
              style={[
                hs.logoRing,
                { backgroundColor: colors.background, borderColor: colors.background },
              ]}
            >
              {merchant?.logoUrl ? (
                <Image
                  source={{ uri: merchant.logoUrl }}
                  style={hs.logoImg}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View
                  style={[hs.logoImg, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}
                >
                  <Ionicons name="storefront" size={32} color={colors.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Name + verified */}
          <View style={{ marginTop: LOGO_SIZE / 2 + 8, alignItems: 'center', paddingHorizontal: H_PAD }}>
            <View style={hs.nameRow}>
              <Text style={[hs.name, { color: colors.text.gray }]} numberOfLines={1}>
                {merchant?.storeName ?? ''}
              </Text>
              {(merchant?.status === 'approved' || merchant?.verified) && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 6 }} />
              )}
            </View>

            {/* Rating row */}
            {rating > 0 && (
              <View style={hs.ratingRow}>
                <StarRating rating={rating} size={14} color={colors.warning} />
                <Text style={[hs.ratingNum, { color: colors.text.gray }]}>
                  {rating.toFixed(1)}
                </Text>
                {reviews > 0 && (
                  <Text style={[hs.reviewCount, { color: colors.text.veryLightGray }]}>
                    ({reviews} reviews)
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }
);
HeroSection.displayName = 'HeroSection';

const hs = StyleSheet.create({
  bannerWrap: { width: '100%', overflow: 'hidden' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  infoWrap: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoOuter: {
    marginTop: -(LOGO_SIZE / 2 + 3),
    zIndex: 10,
  },
  logoRing: {
    width: LOGO_SIZE + 6,
    height: LOGO_SIZE + 6,
    borderRadius: (LOGO_SIZE + 6) / 2,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  logoImg: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingNum: { fontSize: 14, fontWeight: '600' },
  reviewCount: { fontSize: 13 },
});

// ─── HeroSkeleton ─────────────────────────────────────────────────────────────

const HeroSkeleton = memo(({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const cm = isDark ? 'dark' : 'light';
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Skeleton height={BANNER_H} width="100%" colorMode={cm} />
      <View style={{ alignItems: 'center', paddingBottom: 16 }}>
        <View style={{ marginTop: -(LOGO_SIZE / 2 + 4) }}>
          <Skeleton height={LOGO_SIZE + 6} width={LOGO_SIZE + 6} radius={(LOGO_SIZE + 6) / 2} colorMode={cm} />
        </View>
        <View style={{ height: 16 }} />
        <Skeleton height={22} width={160} radius={6} colorMode={cm} />
        <View style={{ height: 8 }} />
        <Skeleton height={14} width={110} radius={4} colorMode={cm} />
      </View>
      <View
        style={{ height: TAB_H, flexDirection: 'row', gap: 12, paddingHorizontal: H_PAD, alignItems: 'center' }}
      >
        {[80, 70, 60].map((w, i) => (
          <Skeleton key={i} height={28} width={w} radius={14} colorMode={cm} />
        ))}
      </View>
    </View>
  );
});
HeroSkeleton.displayName = 'HeroSkeleton';

// ─── ProductSkeletons ─────────────────────────────────────────────────────────

const ProductSkeletons = memo(
  ({ colors, isDark, cardW }: { colors: any; isDark: boolean; cardW: number }) => {
    const cm = isDark ? 'dark' : 'light';
    return (
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, paddingHorizontal: H_PAD, paddingTop: 16 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={{ width: cardW, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.cardBackground }}
          >
            <Skeleton height={cardW} width="100%" colorMode={cm} />
            <View style={{ padding: 10, gap: 6 }}>
              <Skeleton height={12} width="70%" radius={4} colorMode={cm} />
              <Skeleton height={14} width={60} radius={4} colorMode={cm} />
            </View>
          </View>
        ))}
      </View>
    );
  }
);
ProductSkeletons.displayName = 'ProductSkeletons';

// ─── AboutSection ─────────────────────────────────────────────────────────────

const AboutSection = memo(({ merchant, colors }: { merchant: Merchant | null; colors: any }) => (
  <View style={[ab.wrap, { backgroundColor: colors.cardBackground }]}>
    <Text style={[ab.title, { color: colors.text.gray }]}>About</Text>
    <Text style={[ab.body, { color: colors.text.mediumGray }]}>
      {merchant?.description?.trim() || 'No description provided.'}
    </Text>
  </View>
));
AboutSection.displayName = 'AboutSection';

const ab = StyleSheet.create({
  wrap: { margin: H_PAD, borderRadius: 20, padding: 20 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 24 },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = memo(
  ({ tab, colors }: { tab: Tab; colors: any }) => (
    <View style={es.wrap}>
      <Ionicons
        name={tab === 'products' ? 'cube-outline' : 'chatbubble-ellipses-outline'}
        size={52}
        color={colors.text.veryLightGray}
      />
      <Text style={[es.label, { color: colors.text.veryLightGray }]}>
        {tab === 'products' ? 'No products yet' : 'No reviews yet'}
      </Text>
    </View>
  )
);
EmptyState.displayName = 'EmptyState';

const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 64, gap: 14 },
  label: { fontSize: 15 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MerchantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
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

  const CARD_W = (width - H_PAD * 2 - CARD_GAP) / 2;

  // ── Sticky animations ──────────────────────────────────────────────────────
  const navOpacity = scrollY.interpolate({
    inputRange: [BANNER_H - 70, BANNER_H + 10],
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
    } catch { /* silent */ }
  }, [id]);

  const fetchProducts = useCallback(
    async (pg = 1) => {
      if (!id) return;
      try {
        if (pg === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const res = await axiosInstance.get(`/merchants/store/${id}/products`, {
          params: { page: pg, limit: 20, currencyCode },
        });

        const raw = res.data;
        let items: any[] = [];
        if (Array.isArray(raw?.data)) items = raw.data;
        else if (Array.isArray(raw?.products)) items = raw.products;
        else if (Array.isArray(raw)) items = raw;

        const normalized = items.map((p) => {
          try { return normalizeProduct(p); } catch { return p as NormalizedProduct; }
        }).filter(Boolean) as NormalizedProduct[];

        setProducts((prev) => (pg === 1 ? normalized : [...prev, ...normalized]));

        const total = raw?.meta?.total ?? raw?.total ?? normalized.length;
        setHasMore(pg * 20 < total);
        setPage(pg);
      } catch {
        setError('Failed to load products');
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
    } catch { /* silent */ }
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
  const ListHeader = useMemo(
    () => (
      <>
        <HeroSection merchant={merchant} colors={colors} isDark={isDark} />
        <TabBarContent activeTab={activeTab} onChange={handleTabChange} colors={colors} />
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [merchant, colors, isDark, activeTab]
  );

  const renderProduct = useCallback(
    ({ item, index }: { item: NormalizedProduct; index: number }) => (
      <View style={{ width: CARD_W, marginLeft: index % 2 === 0 ? 0 : CARD_GAP }}>
        <ProductCard item={item} variant="grid" />
      </View>
    ),
    [CARD_W]
  );

  const renderReview = useCallback(
    ({ item }: { item: Review }) => <ReviewCard review={item} colors={colors} />,
    [colors]
  );

  const keyProduct = useCallback((item: NormalizedProduct) => item.id, []);
  const keyReview = useCallback((item: Review) => item._id, []);

  const scrollHandler = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY]
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
    ),
    [isRefreshing, handleRefresh, colors.primary]
  );

  // ── Skeleton ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.fixedBack, { top: insets.top + 8 }]}>
          <Pressable style={[s.backCircle, { backgroundColor: colors.cardBackground }]} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.text.gray} />
          </Pressable>
        </View>
        <HeroSkeleton colors={colors} isDark={isDark} />
        <ProductSkeletons colors={colors} isDark={isDark} cardW={CARD_W} />
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !merchant) {
    return (
      <View style={[s.root, s.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.text.veryLightGray} />
        <Text style={[s.errorMsg, { color: colors.text.gray }]}>Could not load store</Text>
        <Pressable style={[s.retryBtn, { backgroundColor: colors.primary }]} onPress={() => fetchProducts(1)}>
          <Text style={{ color: colors.text.white, fontWeight: '600', fontSize: 15 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Content ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* ── Fixed back button (always visible) ── */}
      <View style={[s.fixedBack, { top: insets.top + 8 }]}>
        <Pressable
          style={[s.backCircle, { backgroundColor: colors.cardBackground }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.gray} />
        </Pressable>
      </View>

      {/* ── Sticky collapsing nav header (merchant name appears on scroll) ── */}
      <Animated.View
        style={[
          s.stickyNav,
          {
            opacity: navOpacity,
            backgroundColor: colors.background,
            paddingTop: insets.top,
            borderBottomColor: colors.borderLight,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[s.stickyNavTitle, { color: colors.text.gray }]} numberOfLines={1}>
          {merchant?.storeName ?? ''}
        </Text>
      </Animated.View>

      {/* ── Sticky tab bar (slides in when inline tabs scroll away) ── */}
      <Animated.View
        style={[
          s.stickyTab,
          {
            top: insets.top + STICKY_NAV_H,
            backgroundColor: colors.background,
            borderBottomColor: colors.borderLight,
            opacity: stickyTabOpacity,
            transform: [{ translateY: stickyTabY }],
          },
        ]}
      >
        <TabBarContent activeTab={activeTab} onChange={handleTabChange} colors={colors} />
      </Animated.View>

      {/* ── Products tab ── */}
      {activeTab === 'products' && (
        <Animated.FlatList<NormalizedProduct>
          data={products}
          numColumns={2}
          keyExtractor={keyProduct}
          renderItem={renderProduct}
          columnWrapperStyle={{ gap: CARD_GAP }}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 32 }]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyState tab="products" colors={colors} />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={s.loadMore}>
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

      {/* ── Reviews tab ── */}
      {activeTab === 'reviews' && (
        <Animated.FlatList<Review>
          data={reviews}
          keyExtractor={keyReview}
          renderItem={renderReview}
          contentContainerStyle={[s.listContentSingle, { paddingBottom: insets.bottom + 32 }]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyState tab="reviews" colors={colors} />}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
        />
      )}

      {/* ── About tab ── */}
      {activeTab === 'about' && (
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={refreshControl}
        >
          {ListHeader}
          <AboutSection merchant={merchant} colors={colors} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },

  // Fixed back button
  fixedBack: {
    position: 'absolute',
    left: H_PAD,
    zIndex: 200,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
    }),
  },

  // Sticky nav (merchant name)
  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: STICKY_NAV_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyNavTitle: { fontSize: 16, fontWeight: '700' },

  // Sticky tab bar
  stickyTab: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // List content padding
  listContent: { paddingHorizontal: H_PAD, paddingTop: 16 },
  listContentSingle: { paddingTop: 16 },

  // Load more indicator
  loadMore: { paddingVertical: 24, alignItems: 'center' },

  // Error screen
  errorMsg: { fontSize: 16, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
});
