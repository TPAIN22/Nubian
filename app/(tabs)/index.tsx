import {
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";
import BannerSkeleton from "@/components/BannerSkeleton";
import { useHomeQuery } from "@/hooks/useHomeQuery";
import {
  navigateToTrending,
  navigateToFlashDeals,
  navigateToNewArrivals,
  navigateToForYou,
} from "@/utils/deepLinks";
import i18n from "@/utils/i18n";
import { resolveApiBaseUrl } from "@/services/api/baseUrl";
import { navigateToCategory } from "@/utils/deepLinks";
import useCategoryStore from "@/store/useCategoryStore";

import { BannerCarousel } from "@/components/home/BannerCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ProductSection } from "@/components/home/ProductSection";
import { StoreHighlights } from "@/components/home/StoreHighlights";
import { BenefitsBanner } from "@/components/home/BenefitsBanner";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeHeader } from "@/components/home/HomeHeader";
import { QuickCollections } from "@/components/home/QuickCollections";
import { SubCategoryTabs } from "@/components/home/SubCategoryTabs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  const { categories: storeCategories, fetchCategories } = useCategoryStore();
  const categories = storeCategories || [];

  const { setScrollY } = useScrollStore();
  const { theme } = useTheme();
  const Colors = theme.colors;

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = useCallback(() => {
    refresh();
    fetchCategories();
  }, [refresh, fetchCategories]);

  const isEmpty = useMemo(() => {
    return (
      !isLoading &&
      banners.length === 0 &&
      trending.length === 0 &&
      flashDeals.length === 0 &&
      newArrivals.length === 0 &&
      forYou.length === 0 &&
      stores.length === 0 &&
      categories.length === 0
    );
  }, [isLoading, banners, trending, flashDeals, newArrivals, forYou, stores, categories]);

  const handleTabPress = useCallback((tabId: string) => {
    if (tabId === 'all') return;
    const selectedCategory = categories.find((c: any) => c._id === tabId);
    if (selectedCategory) {
      navigateToCategory(tabId, selectedCategory);
    }
  }, [categories]);

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<{ [key: string]: number }>({});
  const [activeSubTab, setActiveSubTab] = useState("Trending");

  const handleSubTabPress = useCallback((tab: string) => {
    setActiveSubTab(tab);
    const ypos = sectionPositions.current[tab];
    if (ypos !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, ypos - 120), animated: true });
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <HomeHeader categories={categories} activeTab="all" onTabPress={handleTabPress} />
      <ScrollView
        ref={scrollViewRef}
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
        {/* Empty State UI */}
        {isEmpty && (
          <HomeEmptyState colors={Colors} onRefresh={handleRefresh} />
        )}

        {/* Hero Banner */}
        {isLoading ? (
          <BannerSkeleton />
        ) : (
          <BannerCarousel banners={banners} colors={Colors} />
        )}

        {/* Quick Collections matching Shein design */}
        {!isLoading && !isEmpty && (
          <QuickCollections colors={Colors} />
        )}

        {/* Categories Tab Strip */}
        {!isLoading && !isEmpty && (
          <SubCategoryTabs colors={Colors} activeTab={activeSubTab} onTabPress={handleSubTabPress} />
        )}

        {/* Bubbled Category Grid */}
        {!isLoading && !isEmpty && categories.length > 0 && (
          <CategoryGrid categories={categories} colors={Colors} />
        )}

        {/* New Arrivals */}
        <View onLayout={(e) => sectionPositions.current['New Arrivals'] = e.nativeEvent.layout.y}>
          <ProductSection
            title={i18n.t("home_newArrivals")}
            products={newArrivals}
            colors={Colors}
            isLoading={isLoading}
            onViewAll={navigateToNewArrivals}
          />
        </View>

        {/* Trending Now */}
        <View onLayout={(e) => sectionPositions.current['Trending'] = e.nativeEvent.layout.y}>
          <ProductSection
            title={i18n.t("home_trendingNow")}
            products={trending}
            colors={Colors}
            isLoading={isLoading}
            onViewAll={navigateToTrending}
          />
        </View>

        {/* Flash Deals with Countdown */}
        <View onLayout={(e) => sectionPositions.current['Flash Deals'] = e.nativeEvent.layout.y}>
          <ProductSection
            title={i18n.t("home_flashDeals")}
            products={flashDeals}
            colors={Colors}
            isLoading={isLoading}
            onViewAll={navigateToFlashDeals}
            showCountdown={flashDeals.length > 0}
          />
        </View>

        {/* For You */}
        <View onLayout={(e) => sectionPositions.current['For You'] = e.nativeEvent.layout.y}>
          <ProductSection
            title={i18n.t("home_forYou")}
            products={forYou}
            colors={Colors}
            isLoading={isLoading}
            onViewAll={navigateToForYou}
          />
        </View>

        {/* Store Highlights */}
        <View onLayout={(e) => sectionPositions.current['Stores'] = e.nativeEvent.layout.y}>
          <StoreHighlights stores={stores} colors={Colors} />
        </View>

        {/* Benefits Banner */}
        <BenefitsBanner colors={Colors} />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
            <Text style={[styles.debugText, { color: Colors.text.veryLightGray }]}>
              API: {resolveApiBaseUrl()}
            </Text>
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
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default function Index() {
  return <IndexContent />;
}
