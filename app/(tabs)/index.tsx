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
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
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
import { QuickCollections } from "@/components/home/QuickCollections";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import BannerSkeleton from "@/components/BannerSkeleton";
import { AppText, SkeletonBlock, Touchable } from "@/components/ui/kit";
import {
  elevation,
  HIT_SLOP,
  iconSize,
  pressScale,
  radius,
  SCREEN_PADDING,
  spacing,
} from "@/theme/tokens";
import i18n from "@/utils/i18n";

/** Category tile geometry — one place so the rail and its skeleton agree. */
const BUBBLE_WIDTH = 82;
const BUBBLE_HEIGHT = 96;

// ─── Floating Header ──────────────────────────────────────────────────────────
// Transparent at y=0 (white controls over the hero), blurs in as the user
// scrolls. The search affordance is a real pill rather than a bare magnifier —
// a tappable field is the single most-used control on a commerce home screen
// and it should look like one.

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

    // Over the hero the controls are white; once the blur is opaque they switch
    // to the normal ink colour so they stay legible on the light canvas.
    const iconColor = isScrolled ? colors.text.title : "#FFFFFF";
    const pillBg = isScrolled ? colors.surfaceMuted : "rgba(255,255,255,0.22)";
    const pillBorder = isScrolled ? colors.border : "rgba(255,255,255,0.35)";
    const pillText = isScrolled ? colors.text.muted : "rgba(255,255,255,0.92)";

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
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surface, opacity: 0.72 },
            ]}
          />
        </Animated.View>

        <View style={styles.headerRow}>
          <Touchable
            onPress={() => router.push("/(tabs)/explore" as any)}
            scaleTo={pressScale.button}
            accessibilityRole="search"
            accessibilityLabel={i18n.t("searchPlaceholder")}
            style={[
              styles.searchPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
            ]}
          >
            <Ionicons name="search" size={iconSize.md} color={iconColor} />
            <AppText variant="bodySmall" numberOfLines={1} style={{ color: pillText, flex: 1 }}>
              {i18n.t("searchPlaceholder")}
            </AppText>
          </Touchable>

          <Touchable
            hitSlop={HIT_SLOP}
            onPress={() => router.push("/(tabs)/wishlist" as any)}
            scaleTo={pressScale.icon}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("wishlist")}
            style={styles.iconBtn}
          >
            <Ionicons name="heart-outline" size={iconSize.lg} color={iconColor} />
          </Touchable>

          <Touchable
            hitSlop={HIT_SLOP}
            onPress={() => router.push("/(tabs)/cart" as any)}
            scaleTo={pressScale.icon}
            accessibilityRole="button"
            accessibilityLabel={cartQty > 0 ? `Cart, ${cartQty} items` : "Cart"}
            style={styles.iconBtn}
          >
            <Ionicons name="bag-outline" size={iconSize.lg} color={iconColor} />
            {cartQty > 0 && (
              <View
                style={[
                  styles.cartBadge,
                  { backgroundColor: colors.sale, borderColor: colors.surface },
                ]}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
              >
                <AppText variant="overline" style={styles.cartBadgeText}>
                  {cartQty > 99 ? "99+" : String(cartQty)}
                </AppText>
              </View>
            )}
          </Touchable>
        </View>
      </View>
    );
  }
);
Header.displayName = "Header";

// ─── Category Rail ────────────────────────────────────────────────────────────
// A tall rounded tile with the category photo and its name on a gradient foot.
// Reads as a shortcut into the catalogue rather than as decoration.

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

  const renderSeparator = useCallback(
    () => <View style={{ width: spacing.md }} />,
    []
  );

  if (categories.length === 0) return null;

  return (
    <FlatList
      horizontal
      data={categories}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.bubblesContent}
      ItemSeparatorComponent={renderSeparator}
      renderItem={({ item }) => (
        <Touchable
          onPress={() => handlePress(item)}
          scaleTo={pressScale.card}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          style={[
            styles.bubbleImgWrap,
            { backgroundColor: colors.surfaceMuted },
            elevation.xs,
          ]}
        >
          {item.image ? (
            <Image
              source={{ uri: ikResize(item.image, BUBBLE_WIDTH * 2) ?? item.image }}
              style={styles.bubbleImg}
              contentFit="cover"
              transition={220}
              recyclingKey={item._id}
            />
          ) : (
            <View style={[styles.bubbleImg, styles.bubbleFallback]}>
              <Ionicons name="grid-outline" size={iconSize.xl} color={colors.text.subtle} />
            </View>
          )}

          <LinearGradient
            colors={["transparent", "rgba(11,18,32,0.78)"]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <AppText variant="micro" numberOfLines={2} style={styles.bubbleName}>
            {item.name}
          </AppText>
        </Touchable>
      )}
    />
  );
});
CategoryBubbles.displayName = "CategoryBubbles";

const CategoryBubblesSkeleton = memo(() => (
  <View style={[styles.bubblesContent, styles.bubblesSkeletonRow]}>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <SkeletonBlock
        key={i}
        width={BUBBLE_WIDTH}
        height={BUBBLE_HEIGHT}
        rounded={radius.lg}
      />
    ))}
  </View>
));
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
    collections,
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

  const emptyTopPad = insets.top + 60;

  // ── Sections (virtualized) ─────────────────────────────────────────────────
  // The home feed is a vertical FlatList of section rows instead of a ScrollView
  // that mounts everything up-front. Only the first `initialNumToRender` sections
  // render on first paint; the rest mount as they scroll into the window. The
  // horizontal product rails inside each section stay as their own FlatLists
  // (supported nested horizontal-in-vertical pattern).
  type SectionKey =
    | "banner" | "categories" | "collections" | "forYou"
    | "trending" | "storeHighlights" | "flashDeals"
    | "newArrivals" | "brands";

  const sections = useMemo<SectionKey[]>(() => {
    if (isEmpty) return [];
    const list: SectionKey[] = ["banner", "categories"];
    // Curated collections sit directly under the category bubbles: both are
    // "where do I start browsing" affordances, and the section must not appear
    // once there is nothing to put in it.
    if (collections.length > 0 || homeLoading) list.push("collections");
    list.push("forYou", "trending", "storeHighlights", "flashDeals", "newArrivals");
    if (brandsYouLove.length > 0 || homeLoading) list.push("brands");
    return list;
  }, [isEmpty, brandsYouLove.length, collections.length, homeLoading]);

  const renderSection = useCallback(
    ({ item }: { item: SectionKey }) => {
      switch (item) {
        case "banner":
          // Hero banner starts at y=0 — header is transparent on top of it
          return homeLoading ? <BannerSkeleton /> : <BannerCarousel banners={banners} colors={colors} />;
        case "categories":
          return categoriesLoading && categories.length === 0
            ? <CategoryBubblesSkeleton />
            : <CategoryBubbles categories={categories} colors={colors} />;
        case "collections":
          return <QuickCollections collections={collections} isLoading={homeLoading} />;
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
              title={i18n.t("home_trendingNow")}
              emoji="🔥"
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
              title={i18n.t("home_flashDeals")}
              emoji="⚡"
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
      homeLoading, banners, colors, categoriesLoading, categories, collections, isDark,
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
        // Clears the floating tab bar plus a full section gap, so the last rail
        // never sits under the chrome.
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
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
            colors={[colors.primary]}
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
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm,
    height: 60,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 42,
    paddingHorizontal: spacing.base,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  iconBtn: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 2,
    end: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: "#FFFFFF" },

  // Category rail
  bubblesContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  bubblesSkeletonRow: { flexDirection: "row", gap: spacing.md },
  bubbleImgWrap: {
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleImg: { width: "100%", height: "100%" },
  bubbleFallback: { alignItems: "center", justifyContent: "center" },
  bubbleName: {
    position: "absolute",
    bottom: spacing.sm,
    start: spacing.xs,
    end: spacing.xs,
    textAlign: "center",
    color: "#FFFFFF",
  },
});

export default function Index() {
  return <IndexContent />;
}
