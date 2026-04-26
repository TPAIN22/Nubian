import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  InteractionManager,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/providers/ThemeProvider";
import { useHomeQuery } from "@/hooks/useHomeQuery";
import { useRecommendationStore } from "@/store/useRecommendationStore";
import useCartStore from "@/store/useCartStore";
import useCategoryStore from "@/store/useCategoryStore";
import { useTracking } from "@/hooks/useTracking";
import {
  navigateToCategory,
  navigateToFlashDeals,
  navigateToForYou,
  navigateToNewArrivals,
  navigateToTrending,
} from "@/utils/deepLinks";

import { LinearGradient } from "expo-linear-gradient";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { ProductSection } from "@/components/home/ProductSection";
import { StoreHighlights } from "@/components/home/StoreHighlights";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import BannerSkeleton from "@/components/BannerSkeleton";
import i18n from "@/utils/i18n";

// ─── Floating Header ──────────────────────────────────────────────────────────
// Transparent at y=0 (white icons over banner), blurs in as user scrolls.

interface HeaderProps {
  colors: any;
  isDark: boolean;
  insetTop: number;
  isScrolled: boolean;
  bgOpacity: any; // Animated.AnimatedInterpolation
}

const Header = memo(
  ({ colors, isDark, insetTop, isScrolled, bgOpacity }: HeaderProps) => {
    const router = useRouter();
    const cartQty = useCartStore((s: any) => s.cart?.totalQuantity ?? 0);
    const iconColor = isScrolled ? colors.text.gray : "#FFFFFF";

    return (
      <View style={[styles.header, { paddingTop: insetTop }]}>
        {/* Blur layer — fades in on scroll */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}
          pointerEvents="none"
        >
          <BlurView
            intensity={90}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Icon row */}
        <View style={styles.headerRow}>
          <Pressable
            hitSlop={12}
            onPress={() => router.push("/(tabs)/explore" as any)}
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={24} color={iconColor} />
          </Pressable>

          <View style={styles.headerRight}>
            <Pressable
              hitSlop={12}
              onPress={() => router.push("/(tabs)/wishlist" as any)}
              style={styles.iconBtn}
            >
              <Ionicons name="heart-outline" size={24} color={iconColor} />
            </Pressable>

            <Pressable
              hitSlop={12}
              onPress={() => router.push("/(tabs)/cart" as any)}
              style={styles.iconBtn}
            >
              <Ionicons name="bag-outline" size={24} color={iconColor} />
              {cartQty > 0 && (
                <View
                  style={[
                    styles.cartBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.cartBadgeText}>
                    {cartQty > 99 ? "99+" : String(cartQty)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
);
Header.displayName = "Header";

// ─── Category Bubbles ─────────────────────────────────────────────────────────
// Circular image + label below. Shows category images.

interface CategoryBubblesProps {
  categories: any[];
  colors: any;
}

const CategoryBubbles = memo(({ categories, colors }: CategoryBubblesProps) => {
  const { trackEvent } = useTracking();

  const handlePress = useCallback(
    (category: any) => {
      navigateToCategory(category._id, category);
      InteractionManager.runAfterInteractions(() => {
        trackEvent("category_click", {
          categoryId: category._id,
          screen: "home",
        });
      });
    },
    [trackEvent]
  );

  if (categories.length === 0) return null;

  return (
    <FlatList
      horizontal
      data={categories}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.bubblesContent}
      renderItem={({ item }) => (
        <Pressable onPress={() => handlePress(item)} style={styles.bubble}>
          <View
            style={[
              styles.bubbleImgWrap,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.bubbleImg}
                contentFit="cover"
                transition={200}
                recyclingKey={item._id}
              />
            ) : (
              <Ionicons
                name="grid-outline"
                size={26}
                color={colors.text.lightGray}
              />
            )}
            {/* Gradient shade from midpoint down */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.68)"]}
              start={{ x: 0, y: 0.45 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.bubbleName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
});
CategoryBubbles.displayName = "CategoryBubbles";

// ─── Home Screen ──────────────────────────────────────────────────────────────

function IndexContent() {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { trackEvent } = useTracking();

  // ── Data ──────────────────────────────────────────────────────────────────

  const {
    banners,
    trending: homeTrending,
    flashDeals: homeFlashDeals,
    newArrivals: homeNewArrivals,
    forYou: homeForYou,
    isLoading: homeLoading,
    isRefreshing,
    refresh,
  } = useHomeQuery();

  const { categories: rawCategories, fetchCategories } = useCategoryStore();
  const categories = useMemo(() => rawCategories ?? [], [rawCategories]);

  const {
    homeRecommendations,
    isHomeRecommendationsLoading,
    fetchHomeRecommendations,
  } = useRecommendationStore();

  const forYou      = homeRecommendations?.forYou       ?? homeForYou;
  const trending    = homeRecommendations?.trending     ?? homeTrending;
  const flashDeals  = homeRecommendations?.flashDeals   ?? homeFlashDeals;
  const newArrivals = homeRecommendations?.newArrivals  ?? homeNewArrivals;
  const brandsYouLove = homeRecommendations?.brandsYouLove ?? [];

  const isProductsLoading = homeLoading || isHomeRecommendationsLoading;

  // ── Scroll animation ──────────────────────────────────────────────────────

  const scrollY = useRef(new Animated.Value(0)).current;
  const isScrolledRef = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastDepthRef = useRef(0);

  // Header background fades from transparent → opaque over first 80px
  const headerBgOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [scrollY]
  );

  // Combined scroll handler: drives animation + JS-side state updates
  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: false,
          listener: (e: any) => {
            const y: number = e.nativeEvent.contentOffset.y;

            // Toggle icon color at threshold
            const scrolled = y > 60;
            if (scrolled !== isScrolledRef.current) {
              isScrolledRef.current = scrolled;
              setIsScrolled(scrolled);
            }

            // Depth analytics (non-blocking, every 300px bucket)
            const bucket = Math.floor(y / 300) * 300;
            if (bucket > lastDepthRef.current) {
              lastDepthRef.current = bucket;
              InteractionManager.runAfterInteractions(() => {
                trackEvent("scroll_depth", {
                  scrollDepth: bucket,
                  screen: "home",
                });
              });
            }
          },
        }
      ),
    [scrollY, trackEvent]
  );

  // ── Content fade-in ───────────────────────────────────────────────────────

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isProductsLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }).start();
    }
  }, [isProductsLoading, fadeAnim]);

  // ── Fetching ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (!homeRecommendations && !isHomeRecommendationsLoading) {
      fetchHomeRecommendations();
    }
  }, [homeRecommendations, isHomeRecommendationsLoading, fetchHomeRecommendations]);

  const handleRefresh = useCallback(() => {
    refresh();
    fetchCategories();
    fetchHomeRecommendations();
  }, [refresh, fetchCategories, fetchHomeRecommendations]);

  // ── Empty state ───────────────────────────────────────────────────────────

  const isEmpty = useMemo(
    () =>
      !isProductsLoading &&
      banners.length === 0 &&
      forYou.length === 0 &&
      trending.length === 0 &&
      flashDeals.length === 0 &&
      newArrivals.length === 0 &&
      categories.length === 0,
    [isProductsLoading, banners, forYou, trending, flashDeals, newArrivals, categories]
  );

  const emptyTopPad = insets.top + 52;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating header: transparent until user scrolls */}
      <Header
        colors={colors}
        isDark={isDark}
        insetTop={insets.top}
        isScrolled={isScrolled}
        bgOpacity={headerBgOpacity}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll as any}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressViewOffset={emptyTopPad}
          />
        }
      >
        {/* Empty state — shifted below header */}
        {isEmpty && (
          <View style={{ paddingTop: emptyTopPad }}>
            <HomeEmptyState colors={colors} onRefresh={handleRefresh} />
          </View>
        )}

        {/* Hero banner starts at y=0 — header is transparent on top of it */}
        {homeLoading ? <BannerSkeleton /> : <BannerCarousel banners={banners} colors={colors} />}

        {/* Everything below fades in once data is ready */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Category bubbles with images */}
          <CategoryBubbles categories={categories} colors={colors} />

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.borderLight },
            ]}
          />

          {/* Product sections */}
          <ProductSection
            title={i18n.t("home_forYou")}
            products={forYou}
            colors={colors}
            isLoading={isProductsLoading}
            onViewAll={navigateToForYou}
          />
          <ProductSection
            title={`${i18n.t("home_trendingNow")} 🔥`}
            products={trending}
            colors={colors}
            isLoading={isProductsLoading}
            onViewAll={navigateToTrending}
          />
          <StoreHighlights
            colors={colors}
            isDark={isDark}
          />
          <ProductSection
            title={`${i18n.t("home_flashDeals")} ⚡`}
            products={flashDeals}
            colors={colors}
            isLoading={isProductsLoading}
            onViewAll={navigateToFlashDeals}
            showCountdown={flashDeals.length > 0}
          />
          <ProductSection
            title={i18n.t("home_newArrivals")}
            products={newArrivals}
            colors={colors}
            isLoading={isProductsLoading}
            onViewAll={navigateToNewArrivals}
          />
          {(brandsYouLove.length > 0 || isHomeRecommendationsLoading) && (
            <ProductSection
              title={i18n.t("home_brandsYouLove")}
              products={brandsYouLove}
              colors={colors}
              isLoading={isHomeRecommendationsLoading}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 52,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBtn: { position: "relative", padding: 4 },
  cartBadge: {
    position: "absolute",
    top: 1,
    right: 1,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#fff", fontSize: 8, fontWeight: "800" },

  // Category bubbles
  bubblesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  bubble: {
    width: 76,
  },
  bubbleImgWrap: {
    width: 76,
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleImg: {
    width: "100%",
    height: "100%",
  },
  bubbleName: {
    position: "absolute",
    bottom: 7,
    left: 5,
    right: 5,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
  },

  // Misc
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.4,
  },
});

export default function Index() {
  return <IndexContent />;
}
