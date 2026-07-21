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
import { useNotification } from "@/providers/notificationProvider";
import { useHomeQuery } from "@/hooks/useHomeQuery";
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
import { ikResize } from "@/utils/imageCdn";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { ProductSection } from "@/components/home/ProductSection";
import { StoreHighlights } from "@/components/home/StoreHighlights";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import BannerSkeleton from "@/components/BannerSkeleton";
import { Skeleton } from "moti/skeleton";
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
            hitSlop={16}
            onPress={() => router.push("/(tabs)/explore" as any)}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={24} color={iconColor} />
          </Pressable>

          <View style={styles.headerRight}>
            <Pressable
              hitSlop={16}
              onPress={() => router.push("/(tabs)/wishlist" as any)}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
              style={styles.iconBtn}
            >
              <Ionicons name="heart-outline" size={24} color={iconColor} />
            </Pressable>

            <Pressable
              hitSlop={16}
              onPress={() => router.push("/(tabs)/cart" as any)}
              accessibilityRole="button"
              accessibilityLabel={
                cartQty > 0 ? `Cart, ${cartQty} items` : "Cart"
              }
              style={styles.iconBtn}
            >
              <Ionicons name="bag-outline" size={24} color={iconColor} />
              {cartQty > 0 && (
                <View
                  style={[
                    styles.cartBadge,
                    { backgroundColor: colors.primary },
                  ]}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
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
        <Pressable
          onPress={() => handlePress(item)}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          style={styles.bubble}
        >
          <View
            style={[
              styles.bubbleImgWrap,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: ikResize(item.image, 76) ?? item.image }}
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

const CategoryBubblesSkeleton = memo(({ isDark }: { isDark: boolean }) => {
  const colorMode = isDark ? "dark" : "light";
  return (
    <View style={[styles.bubblesContent, { flexDirection: "row" }]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.bubble}>
          <Skeleton height={88} width={76} radius={14} colorMode={colorMode} />
        </View>
      ))}
    </View>
  );
});
CategoryBubblesSkeleton.displayName = "CategoryBubblesSkeleton";

// ─── Home Screen ──────────────────────────────────────────────────────────────

function IndexContent() {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { trackEvent } = useTracking();
  const { promptIfAppropriate } = useNotification();

  // First-visit nudge for notifications. The sheet self-throttles via
  // AsyncStorage cooldowns, so this is safe to fire on every home mount —
  // it'll only actually show on eligible occasions.
  useEffect(() => {
    const timer = setTimeout(() => {
      promptIfAppropriate("general").catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, [promptIfAppropriate]);

  // ── Data ──────────────────────────────────────────────────────────────────

  // Single source of truth for home product lists: useHomeStore via useHomeQuery.
  // The /home backend endpoint now returns brandsYouLove too (was the only thing
  // that used to require a parallel call to /recommendations/home). This kills
  // the dual-source desync that caused stale-currency data to win after a
  // currency switch.
  const {
    banners,
    trending,
    flashDeals,
    newArrivals,
    forYou,
    brandsYouLove,
    isLoading: homeLoading,
    isRefreshing,
    refresh,
  } = useHomeQuery();

  const {
    categories: rawCategories,
    loading: categoriesLoading,
    fetchCategories,
  } = useCategoryStore();
  const categories = useMemo(() => rawCategories ?? [], [rawCategories]);

  const isProductsLoading = homeLoading;

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
          // Native-driven: the header opacity interpolation runs on the UI thread
          // so the blur fade tracks the finger even while the feed is hydrating.
          // The JS listener below still fires for the threshold toggle + analytics.
          useNativeDriver: true,
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

  // ── Fetching ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = useCallback(() => {
    refresh();
    fetchCategories();
  }, [refresh, fetchCategories]);

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

  // ── Sections (virtualized) ─────────────────────────────────────────────────
  // The home feed is a vertical FlatList of section rows instead of a ScrollView
  // that mounts everything up-front. Only the first `initialNumToRender` sections
  // render on first paint; the rest mount as they scroll into the window. The
  // horizontal product rails inside each section stay as their own FlatLists
  // (supported nested horizontal-in-vertical pattern).
  type SectionKey =
    | "banner" | "categories" | "divider" | "forYou"
    | "trending" | "storeHighlights" | "flashDeals"
    | "newArrivals" | "brands";

  const sections = useMemo<SectionKey[]>(() => {
    if (isEmpty) return [];
    const list: SectionKey[] = [
      "banner", "categories", "divider",
      "forYou", "trending", "storeHighlights", "flashDeals", "newArrivals",
    ];
    if (brandsYouLove.length > 0 || homeLoading) list.push("brands");
    return list;
  }, [isEmpty, brandsYouLove.length, homeLoading]);

  const renderSection = useCallback(
    ({ item }: { item: SectionKey }) => {
      switch (item) {
        case "banner":
          // Hero banner starts at y=0 — header is transparent on top of it
          return homeLoading ? <BannerSkeleton /> : <BannerCarousel banners={banners} colors={colors} />;
        case "categories":
          return categoriesLoading && categories.length === 0
            ? <CategoryBubblesSkeleton isDark={isDark} />
            : <CategoryBubbles categories={categories} colors={colors} />;
        case "divider":
          return <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />;
        case "forYou":
          return (
            <ProductSection
              title={i18n.t("home_forYou")}
              products={forYou}
              colors={colors}
              isLoading={isProductsLoading}
              onViewAll={navigateToForYou}
            />
          );
        case "trending":
          return (
            <ProductSection
              title={`${i18n.t("home_trendingNow")} 🔥`}
              products={trending}
              colors={colors}
              isLoading={isProductsLoading}
              onViewAll={navigateToTrending}
            />
          );
        case "storeHighlights":
          return <StoreHighlights colors={colors} isDark={isDark} />;
        case "flashDeals":
          return (
            <ProductSection
              title={`${i18n.t("home_flashDeals")} ⚡`}
              products={flashDeals}
              colors={colors}
              isLoading={isProductsLoading}
              onViewAll={navigateToFlashDeals}
              showCountdown={flashDeals.length > 0}
            />
          );
        case "newArrivals":
          return (
            <ProductSection
              title={i18n.t("home_newArrivals")}
              products={newArrivals}
              colors={colors}
              isLoading={isProductsLoading}
              onViewAll={navigateToNewArrivals}
            />
          );
        case "brands":
          return (
            <ProductSection
              title={i18n.t("home_brandsYouLove")}
              products={brandsYouLove}
              colors={colors}
              isLoading={homeLoading}
            />
          );
        default:
          return null;
      }
    },
    [
      homeLoading, banners, colors, categoriesLoading, categories, isDark,
      forYou, trending, flashDeals, newArrivals, brandsYouLove, isProductsLoading,
    ]
  );

  const keyExtractor = useCallback((item: SectionKey) => item, []);

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

      <Animated.FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={keyExtractor}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll as any}
        scrollEventThrottle={16}
        initialNumToRender={3}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            progressViewOffset={emptyTopPad}
          />
        }
        ListEmptyComponent={
          <View style={{ paddingTop: emptyTopPad }}>
            <HomeEmptyState colors={colors} onRefresh={handleRefresh} />
          </View>
        }
      />
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
    end: 1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

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
    fontSize: 11,
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
