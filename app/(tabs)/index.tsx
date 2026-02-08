import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ScrollView,
  I18nManager,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useCallback, useEffect, useState, memo, useMemo } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Carousel from "react-native-reanimated-carousel";
import ItemCard from "@/components/Card";
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";
import BannerSkeleton from "@/components/BannerSkeleton";
import { useHomeQuery } from "@/hooks/useHomeQuery";
import { HomeProduct, HomeCategory, HomeStore } from "@/api/home.api";
import ItemCardSkeleton from "@/components/ItemCardSkeleton";
import { normalizeProduct } from "@/domain/product/product.normalize";
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  navigateToCategory,
  navigateToStore,
  navigateBanner,
  navigateToTrending,
  navigateToFlashDeals,
  navigateToNewArrivals,
  navigateToForYou,
} from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { useResponsive } from "@/hooks/useResponsive";
import i18n from "@/utils/i18n";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ───────────────────────────── Hero Welcome ───────────────────────────── */

const HeroWelcome = memo(({ colors }: { colors: any }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return i18n.t("home_welcomeMorning");
    if (hour < 17) return i18n.t("home_welcomeAfternoon");
    return i18n.t("home_welcomeEvening");
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark || colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroWelcome}
    >
      <View style={styles.heroContent}>
        <Text style={[styles.heroGreeting, { color: colors.text.white }]}>
          {getGreeting()} 👋
        </Text>
        <Text style={[styles.heroMessage, { color: colors.text.white }]}>
          {i18n.t("home_welcomeMessage")}
        </Text>
      </View>
    </LinearGradient>
  );
});
HeroWelcome.displayName = "HeroWelcome";

/* ───────────────────────────── Quick Actions Bar ───────────────────────────── */

const QuickActionsBar = memo(({ colors }: { colors: any }) => {
  const { trackEvent } = useTracking();
  const isRTL = I18nManager.isRTL;

  const actions = [
    {
      id: "categories",
      icon: "grid-outline" as const,
      label: i18n.t("home_exploreCategories"),
      onPress: () => router.push("/(tabs)/explor"),
    },
    {
      id: "deals",
      icon: "flash-outline" as const,
      label: i18n.t("home_todaysDeals"),
      onPress: () => navigateToFlashDeals(),
    },
    {
      id: "trending",
      icon: "trending-up-outline" as const,
      label: i18n.t("home_trendingNow"),
      onPress: () => navigateToTrending(),
    },
    {
      id: "new",
      icon: "sparkles-outline" as const,
      label: i18n.t("home_newArrivals"),
      onPress: () => navigateToNewArrivals(),
    },
  ];

  return (
    <View style={styles.quickActionsContainer}>
      <FlatList
        data={actions}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.quickActionsContent,
          isRTL && { flexDirection: "row-reverse" },
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.quickActionItem, { backgroundColor: colors.cardBackground }]}
            onPress={() => {
              trackEvent("quick_action_tap", { action: item.id });
              item.onPress();
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name={item.icon} size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text.gray }]} numberOfLines={2}>
              {item.label}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
});
QuickActionsBar.displayName = "QuickActionsBar";

/* ───────────────────────────── Flash Deals Countdown ───────────────────────────── */

const FlashDealsCountdown = memo(({ colors }: { colors: any }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set end of day as deal expiry
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.countdownContainer, { backgroundColor: colors.warning + "15" }]}>
      <Ionicons name="time-outline" size={18} color={colors.warning} />
      <Text style={[styles.countdownLabel, { color: colors.warning }]}>
        {i18n.t("home_flashDealsEndsIn")}:
      </Text>
      <View style={styles.countdownTimers}>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.hours).padStart(2, "0")}</Text>
          <Text style={styles.countdownUnit}>{i18n.t("home_hoursShort")}</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: colors.warning }]}>:</Text>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.minutes).padStart(2, "0")}</Text>
          <Text style={styles.countdownUnit}>{i18n.t("home_minutesShort")}</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: colors.warning }]}>:</Text>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.seconds).padStart(2, "0")}</Text>
          <Text style={styles.countdownUnit}>{i18n.t("home_secondsShort")}</Text>
        </View>
      </View>
    </View>
  );
});
FlashDealsCountdown.displayName = "FlashDealsCountdown";

/* ───────────────────────────── Benefits Banner ───────────────────────────── */

const BenefitsBanner = memo(({ colors }: { colors: any }) => {
  const benefits = [
    {
      icon: "car-outline" as const,
      title: i18n.t("home_freeDelivery"),
      desc: i18n.t("home_freeDeliveryDesc"),
    },
    {
      icon: "shield-checkmark-outline" as const,
      title: i18n.t("home_securePayment"),
      desc: i18n.t("home_securePaymentDesc"),
    },
    {
      icon: "ribbon-outline" as const,
      title: i18n.t("home_qualityProducts"),
      desc: i18n.t("home_qualityProductsDesc"),
    },
  ];

  return (
    <View style={[styles.benefitsBanner, { backgroundColor: colors.primary + "08" }]}>
      {benefits.map((benefit, index) => (
        <View key={index} style={styles.benefitItem}>
          <View style={[styles.benefitIconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name={benefit.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.benefitTitle, { color: colors.text.gray }]}>{benefit.title}</Text>
          <Text style={[styles.benefitDesc, { color: colors.text.veryLightGray }]} numberOfLines={2}>
            {benefit.desc}
          </Text>
        </View>
      ))}
    </View>
  );
});
BenefitsBanner.displayName = "BenefitsBanner";

/* ───────────────────────────── Banner Carousel ───────────────────────────── */

const BannerCarousel = memo(
  ({ banners, colors }: { banners: any[]; colors: any }) => {
    const isRTL = I18nManager.isRTL;
    const { window } = useResponsive();
    const screenWidth = window.width;
    const bannerHeight = screenWidth * 0.5;
    const [activeIndex, setActiveIndex] = useState(0);
    const { trackEvent } = useTracking();

    const onProgressChange = useCallback((_: number, absoluteProgress: number) => {
      const index = Math.round(absoluteProgress) % banners.length;
      setActiveIndex(index);
    }, [banners.length]);

    const renderBannerItem = useCallback(({ item }: { item: any }) => (
      <Pressable
        onPress={() => {
          trackEvent('banner_click', {
            bannerId: item._id,
            screen: 'home',
          });
          navigateBanner(item);
        }}
        style={{ width: screenWidth, height: bannerHeight }}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.bannerImage}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={[
            "transparent",
            colors.overlayDark || "rgba(0,0,0,0.8)",
          ]}
          style={styles.bannerOverlay}
        />
        {(item.title || item.description) && (
          <View style={styles.bannerContent}>
            {item.title && (
              <Text style={[styles.bannerTitle, { color: colors.text.white }]}>
                {item.title}
              </Text>
            )}
            {item.description && (
              <Text style={[styles.bannerDescription, { color: colors.text.white }]}>
                {item.description}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    ), [screenWidth, bannerHeight, colors, trackEvent]);

    if (banners.length === 0) return null;

    return (
      <View style={styles.bannersSection}>
        <Carousel
          data={banners}
          width={screenWidth}
          height={bannerHeight}
          loop={banners.length > 1}
          autoPlay={banners.length > 1}
          autoPlayInterval={3500}
          scrollAnimationDuration={800}
          onProgressChange={onProgressChange}
          renderItem={renderBannerItem}
        />

        {banners.length > 1 && (
          <View
            style={[styles.pagination, isRTL && { flexDirection: "row-reverse" }]}
          >
            {banners.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex
                        ? colors.primary
                        : "rgba(255,255,255,0.3)",
                    width: i === activeIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);
BannerCarousel.displayName = "BannerCarousel";

/* ───────────────────────────── Category Grid ───────────────────────────── */

const CategoryGrid = memo(({ categories, colors }: { categories: HomeCategory[]; colors: any }) => {
  const { trackEvent } = useTracking();
  if (categories.length === 0) return null;

  return (
    <View style={styles.categoryGridSection}>
      <View style={styles.sectionHeader}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
          {i18n.t("home_categories")}
        </Text>
      </View>
      <FlatList
        data={categories}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={styles.categoryGrid}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryItem}
            onPress={() => {
              trackEvent('category_open', {
                categoryId: item._id,
                screen: 'home',
              });
              navigateToCategory(item._id, item);
            }}
          >
            <View style={[styles.categoryIconContainer, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryIcon}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="grid-outline" size={24} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.categoryName, { color: colors.text.gray }]} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item, index) => `category-${item._id}-${index}`}
      />
    </View>
  );
});
CategoryGrid.displayName = "CategoryGrid";

/* ───────────────────────────── Product Section ───────────────────────────── */

interface ProductSectionProps {
  title: string;
  products: HomeProduct[];
  colors: any;
  isLoading?: boolean;
  onViewAll?: () => void;
  showCountdown?: boolean;
}

const ProductSection = memo(({
  title,
  products,
  colors,
  isLoading = false,
  onViewAll,
  showCountdown = false,
}: ProductSectionProps) => {
  const { width: screenWidth } = useWindowDimensions();
  // Calculate responsive card width for horizontal scroll
  // Use 45% of screen width for horizontal lists
  const cardWidth = screenWidth * 0.45;
  const itemWidth = cardWidth + 12; // card width + marginRight

  // PERFORMANCE: Pre-normalize products to avoid creating new objects on each render
  // This prevents defeating React.memo on ItemCard
  const normalizedProducts = useMemo(
    () => products.map(normalizeProduct),
    [products]
  );

  // PERFORMANCE: Stable renderItem callback
  const renderItem = useCallback(({ item }: { item: ReturnType<typeof normalizeProduct> }) => (
    <View style={{ width: cardWidth, marginRight: 12 }}>
      <ItemCard
        item={item}
        cardWidth={cardWidth}
      />
    </View>
  ), [cardWidth]);

  // PERFORMANCE: Stable keyExtractor
  const keyExtractor = useCallback((item: ReturnType<typeof normalizeProduct>, index: number) =>
    `${title}-${item.id}-${index}`, [title]);

  // PERFORMANCE: getItemLayout for fast scrolling
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index,
  }), [itemWidth]);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
            {title}
          </Text>
        </View>
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => (
            <View style={{ width: cardWidth, marginRight: 12 }}>
              <ItemCardSkeleton />
            </View>
          )}
          keyExtractor={(_, index) => `${title}-skeleton-${index}`}
        />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
          {title}
        </Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>{i18n.t("home_seeAll")}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {showCountdown && <FlashDealsCountdown colors={colors} />}
      <FlatList
        horizontal
        data={normalizedProducts}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        // PERFORMANCE: FlatList optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={3}
        initialNumToRender={3}
      />
    </View>
  );
});
ProductSection.displayName = "ProductSection";

/* ───────────────────────────── Store Highlights ───────────────────────────── */

const StoreHighlights = memo(({ stores, colors }: { stores: HomeStore[]; colors: any }) => {
  const { trackEvent } = useTracking();
  if (stores.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
          {i18n.t("home_topStores")}
        </Text>
      </View>
      <FlatList
        horizontal
        data={stores}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              trackEvent('store_open', {
                storeId: item._id,
                screen: 'home',
              });
              navigateToStore(item._id, item);
            }}
          >
            <View style={[styles.storeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <View style={[styles.storeIconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="storefront" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.storeName, { color: colors.text.gray }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.storeRating}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[styles.storeRatingText, { color: colors.text.veryLightGray }]}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
              {item.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.text.white} />
                  <Text style={[styles.verifiedText, { color: colors.text.white }]}>{i18n.t("home_verified")}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        keyExtractor={(item, index) => `store-${item._id}-${index}`}
      />
    </View>
  );
});
StoreHighlights.displayName = "StoreHighlights";

/* ───────────────────────────── Main Component ───────────────────────────── */

function IndexContent() {
  const {
    banners,
    trending,
    flashDeals,
    newArrivals,
    forYou,
    stores,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useHomeQuery();

  const { setScrollY } = useScrollStore();
  const { theme } = useTheme();
  const Colors = theme.colors;
  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <View
      style={[styles.container, { backgroundColor: Colors.surface }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <LinearGradient
          colors={[Colors.primary, "transparent"]}
          style={styles.topGradient}
        />



        {/* Hero Banner */}
        {isLoading ? (
          <BannerSkeleton />
        ) : (
          <BannerCarousel banners={banners} colors={Colors} />
        )}

        {/* Quick Actions */}
        <QuickActionsBar colors={Colors} />

        {/* New Arrivals */}
        <ProductSection
          title={i18n.t("home_newArrivals")}
          products={newArrivals}
          colors={Colors}
          isLoading={isLoading}
          onViewAll={navigateToNewArrivals}
        />

        {/* Trending Now */}
        <ProductSection
          title={i18n.t("home_trendingNow")}
          products={trending}
          colors={Colors}
          isLoading={isLoading}
          onViewAll={navigateToTrending}
        />

        {/* Flash Deals with Countdown */}
        <ProductSection
          title={i18n.t("home_flashDeals")}
          products={flashDeals}
          colors={Colors}
          isLoading={isLoading}
          onViewAll={navigateToFlashDeals}
          showCountdown={flashDeals.length > 0}
        />

        {/* For You */}
        <ProductSection
          title={i18n.t("home_forYou")}
          products={forYou}
          colors={Colors}
          isLoading={isLoading}
          onViewAll={navigateToForYou}
        />


        {/* Store Highlights */}
        <StoreHighlights stores={stores} colors={Colors} />

        {/* Benefits Banner */}
        <BenefitsBanner colors={Colors} />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: 300,
    opacity: 0.15,
  },

  // Hero Welcome
  heroWelcome: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 16,
  },
  heroContent: {
    gap: 4,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: "bold",
  },
  heroMessage: {
    fontSize: 16,
    opacity: 0.9,
  },

  // Quick Actions
  quickActionsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionItem: {
    width: 60,
    alignItems: "center",
    padding: 6,
    borderRadius: 6,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "400",
  },

  // Flash Deals Countdown
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  countdownTimers: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 4,
  },
  countdownBox: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 40,
  },
  countdownNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  countdownUnit: {
    fontSize: 9,
    color: "#fff",
    opacity: 0.8,
  },
  countdownSeparator: {
    fontSize: 16,
    fontWeight: "bold",
  },

  // Benefits Banner
  benefitsBanner: {
    flexDirection: "row",
    marginHorizontal: 6,
    marginTop: 26,
    marginBottom: 16,
    padding: 6,
    borderRadius: 16,
    justifyContent: "space-between",
  },
  benefitItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  benefitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },

  // Banner Carousel
  bannersSection: { height: 200, position: "relative" },
  bannerImage: { width: SCREEN_WIDTH, height: 220 },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 200,
  },
  bannerContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 12,
    opacity: 0.9,
  },
  pagination: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },

  // Sections
  section: { marginTop: 25 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    textAlign: "center",
  },
  accentBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { padding: 10, fontSize: 14, fontWeight: "bold", flex: 1, },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    padding: 5,
    fontSize: 12,
    fontWeight: "600",
  },

  // Category Grid
  categoryGridSection: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  categoryGrid: {
    gap: 16,
  },
  categoryItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: "25%",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },

  // Store Cards
  storeCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  storeRatingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Error
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
  },
});

export default function Index() {
  return <IndexContent />;
}
