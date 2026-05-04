import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  Keyboard,
  LayoutAnimation,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useExploreStore } from "@/store/useExploreStore";
import useCategoryStore from "@/store/useCategoryStore";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { navigateToProduct } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { ExploreSort } from "@/api/explore.api";
import useItemStore from "@/store/useItemStore";
import ProductCard from "@/components/ProductCard";
import ItemCardSkeleton from "@/components/ItemCardSkeleton";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { markTapStart, markNavigationCall } from "@/utils/performance";
import { Image } from "expo-image";

const RECENT_KEY = "nubian_recent_searches";
const MAX_RECENT = 6;
const TRENDING = [
  "عطور", "شنط", "ملابس", "أحذية",
  "Perfume", "Bags", "Clothing", "Shoes", "Accessories",
];

type Product = NormalizedProduct;

const ExploreScreen = () => {
  const params = useLocalSearchParams<{
    sort?: string;
    discounted?: string;
    recommendation?: string;
    categoryId?: string;
  }>();
  const { theme, isDark } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { trackEvent } = useTracking();
  const setProduct = useItemStore((s: any) => s.setProduct);

  const {
    products,
    hasMore,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error: exploreError,
    filters,
    sort,
    fetchProducts,
    loadMore: loadMoreProducts,
    refresh: refreshProducts,
    setFilters,
    setSort,
  } = useExploreStore();

  const { categories, fetchCategories } = useCategoryStore();

  // ── Search state ──
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // ── Filter state ──
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ── Animations ──
  const cancelOpacity = useRef(new Animated.Value(0)).current;
  const cancelSlide = useRef(new Animated.Value(20)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const filterBadgeScale = useRef(new Animated.Value(0)).current;

  // ── Header height ──
  const pageTitle = useMemo(() => {
    if (params.discounted === "true") return i18n.t("flashDeals") || "Flash Deals";
    if (params.sort === "trending") return i18n.t("trending") || "Trending";
    if (params.sort === "new") return i18n.t("newArrivals") || "New Arrivals";
    if (params.sort === "best") return i18n.t("bestSellers") || "Best Sellers";
    if (params.sort === "rating") return i18n.t("topRated") || "Top Rated";
    if (params.recommendation === "home") return i18n.t("forYou") || "For You";
    return i18n.t("explore") || "Explore";
  }, [params]);

  const isDefaultExplore = useMemo(
    () => pageTitle === (i18n.t("explore") || "Explore"),
    [pageTitle]
  );

  const HEADER_HEIGHT = useMemo(
    () => insets.top + (isDefaultExplore ? 60 : 98),
    [insets.top, isDefaultExplore]
  );

  // ── Recent searches ──
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => { if (raw) setRecentSearches(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const saveRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((s) => s !== query)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== query);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clearAllRecent = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_KEY).catch(() => {});
  }, []);

  // ── Cancel button animation (plays when isSearchFocused changes) ──
  useEffect(() => {
    if (isSearchFocused) {
      cancelOpacity.setValue(0);
      cancelSlide.setValue(20);
      Animated.parallel([
        Animated.timing(cancelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(cancelSlide, { toValue: 0, tension: 160, friction: 14, useNativeDriver: true }),
      ]).start();
    }
  }, [isSearchFocused, cancelOpacity, cancelSlide]);

  // ── Suggestions panel animation ──
  const openSuggestions = useCallback(() => {
    setShowSuggestions(true);
    Animated.timing(suggestionsOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [suggestionsOpacity]);

  const closeSuggestions = useCallback(() => {
    Animated.timing(suggestionsOpacity, { toValue: 0, duration: 140, useNativeDriver: true })
      .start(() => setShowSuggestions(false));
  }, [suggestionsOpacity]);

  // ── Filter badge ──
  useEffect(() => {
    const active = !!(showAvailableOnly || filterCategory || filters.category || filters.inStock);
    Animated.spring(filterBadgeScale, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      tension: 220,
      friction: 10,
    }).start();
  }, [showAvailableOnly, filterCategory, filters.category, filters.inStock, filterBadgeScale]);

  // ── Search handlers ──
  const handleSearchFocus = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchFocused(true);
    openSuggestions();
  }, [openSuggestions]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      saveRecentSearch(q);
      setActiveSearch(q);
      closeSuggestions();
      Keyboard.dismiss();
      trackEvent("search_query", { searchQuery: q, screen: "explore" });
      fetchProducts({ ...filters, search: q, page: 1, sort } as any);
    },
    [saveRecentSearch, closeSuggestions, trackEvent, fetchProducts, filters, sort]
  );

  const handleCancel = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchInput("");
    setActiveSearch("");
    setIsSearchFocused(false);
    closeSuggestions();
    Keyboard.dismiss();
    fetchProducts({ ...filters, page: 1, sort });
  }, [closeSuggestions, fetchProducts, filters, sort]);

  // ── Initial load ──
  useEffect(() => {
    fetchCategories();

    const initialSort: ExploreSort =
      params.sort === "trending" ? "trending"
      : params.sort === "new" ? "new"
      : params.sort === "best" ? "best_sellers"
      : params.sort === "rating" ? "rating"
      : "recommended";

    const initialFilters: any = {};
    if (params.categoryId) initialFilters.category = params.categoryId;
    if (params.discounted === "true") initialFilters.discount = true;

    fetchProducts({ ...initialFilters, sort: initialSort, page: 1 });
    trackEvent("explore_view", { screen: "explore", sort: initialSort });
  }, [params.sort, params.categoryId, params.discounted]);

  // ── Derived data ──
  const displayProducts = useMemo(() => {
    if (!activeSearch.trim()) return products;
    const q = activeSearch.toLowerCase().trim();
    return products.filter((p: Product) => p.name?.toLowerCase().includes(q));
  }, [products, activeSearch]);

  const hasActiveFilters = useMemo(
    () => !!(filters.category || filters.inStock || showAvailableOnly || filterCategory),
    [filters, showAvailableOnly, filterCategory]
  );

  // ── Event handlers ──
  const handleProductPress = useCallback(
    (item: Product) => {
      if (__DEV__) markTapStart(item.id);
      trackEvent("product_click", { productId: item.id, categoryId: item.categoryId, screen: "explore" });
      navigateToProduct(item.id, item as any);
      if (__DEV__) markNavigationCall(item.id);
      setProduct(item);
    },
    [trackEvent, setProduct]
  );

  const handleSortChange = useCallback(
    (newSort: ExploreSort) => {
      trackEvent("sort_change", { sort: newSort, screen: "explore" });
      setSort(newSort);
    },
    [trackEvent, setSort]
  );

  const openFilterModal = useCallback(() => {
    setFilterCategory(filters.category || null);
    setShowAvailableOnly(filters.inStock === true);
    setShowFilterModal(true);
  }, [filters]);

  const closeFilterModal = useCallback(() => setShowFilterModal(false), []);

  const applyFilters = useCallback(() => {
    const newFilters: any = {};
    if (filterCategory) newFilters.category = filterCategory;
    if (showAvailableOnly) newFilters.inStock = true;
    if (params.discounted === "true") newFilters.discount = true;
    trackEvent("filter_used", { filters: JSON.stringify(newFilters), screen: "explore" });
    closeFilterModal();
    setFilters(newFilters);
  }, [filterCategory, showAvailableOnly, params.discounted, setFilters, trackEvent, closeFilterModal]);

  const clearAllFilters = useCallback(() => {
    setFilterCategory(null);
    setShowAvailableOnly(false);
    trackEvent("filter_clear", { screen: "explore" });
    closeFilterModal();
    useExploreStore.getState().clearFilters();
  }, [trackEvent, closeFilterModal]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    trackEvent("explore_load_more", { screen: "explore" });
    await loadMoreProducts();
  }, [isLoadingMore, hasMore, loadMoreProducts, trackEvent]);

  const onRefresh = useCallback(async () => {
    trackEvent("explore_refresh", { screen: "explore" });
    await refreshProducts();
  }, [refreshProducts, trackEvent]);

  const getSortLabel = useCallback((): string => {
    switch (sort) {
      case "price_high": return String(i18n.t("highestPrice") || "High → Low");
      case "price_low":  return String(i18n.t("lowestPrice") || "Low → High");
      case "trending":   return String(i18n.t("trending") || "Trending");
      case "new":        return String(i18n.t("newArrivals") || "New");
      case "best_sellers": return String(i18n.t("bestSellers") || "Best");
      case "rating":     return String(i18n.t("topRated") || "Top Rated");
      default:           return String(i18n.t("sort") || "Sort");
    }
  }, [sort]);

  const getSortIcon = useCallback((): any => {
    switch (sort) {
      case "price_high": return "arrow-down";
      case "price_low":  return "arrow-up";
      case "trending":   return "trending-up";
      case "new":        return "sparkles";
      default:           return "swap-vertical";
    }
  }, [sort]);

  // ── Render helpers ──
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        onPress={() => handleProductPress(item)}
        showWishlist={false}
      />
    ),
    [handleProductPress]
  );

  const keyExtractor = useCallback(
    (item: Product, index: number) => item.id || `p-${index}`,
    []
  );

  const SkeletonGrid = useCallback(
    () => (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </View>
    ),
    []
  );

  const ListEmptyComponent = useCallback(() => {
    if (isLoading) return <SkeletonGrid />;

    if (exploreError) {
      return (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: (colors.danger || colors.primary) + "18" }]}>
            <Ionicons name="alert-circle-outline" size={44} color={colors.danger || colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
            {String(i18n.t("error") || "Something went wrong")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
            {exploreError}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>{String(i18n.t("retry") || "Retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "12" }]}>
          <Ionicons
            name={activeSearch ? "search-outline" : "bag-outline"}
            size={44}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
          {activeSearch
            ? String(i18n.t("noResults") || "No Results")
            : String(i18n.t("noProducts") || "No Products")}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
          {activeSearch
            ? String(i18n.t("tryNewSearch") || "Try a different search")
            : String(i18n.t("noProductsFound") || "Check back later")}
        </Text>
      </View>
    );
  }, [isLoading, exploreError, activeSearch, onRefresh, colors, SkeletonGrid]);

  // ─────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>

      {/* ── Product Grid ── */}
      <Animated.FlatList
        data={displayProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={displayProducts.length > 0 ? styles.row : undefined}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: HEADER_HEIGHT + 12, paddingBottom: insets.bottom + 100 },
          displayProducts.length === 0 && styles.emptyList,
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.footerText, { color: colors.text.lightGray }]}>
                {String(i18n.t("loading") || "Loading...")}
              </Text>
            </View>
          ) : !hasMore && displayProducts.length > 0 ? (
            <View style={styles.footer}>
              <View style={[styles.footerLine, { backgroundColor: colors.borderLight }]} />
              <Text style={[styles.footerText, { color: colors.text.veryLightGray }]}>
                {String(i18n.t("allProductsShown") || "You've seen it all!")}
              </Text>
            </View>
          ) : null
        }
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={6}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── Fixed Search Header ── */}
      <View
        style={[styles.header, { height: HEADER_HEIGHT }]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={isDark ? 55 : 78}
          tint={isDark ? "dark" : "light"}
          style={[
            StyleSheet.absoluteFill,
            styles.headerBlur,
            { borderBottomColor: colors.borderLight + "70" },
          ]}
        />

        <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
          {!isDefaultExplore && (
            <Text
              style={[styles.pageTitle, { color: colors.text.gray }]}
              numberOfLines={1}
            >
              {pageTitle}
            </Text>
          )}

          {/* Search row */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: isSearchFocused ? colors.primary : colors.borderLight,
                  shadowColor: isSearchFocused ? colors.primary : "transparent",
                },
              ]}
            >
              <Ionicons
                name="search"
                size={17}
                color={isSearchFocused ? colors.primary : colors.text.mediumGray}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text.gray }]}
                placeholder={String(i18n.t("searchProducts") || "Search products...")}
                placeholderTextColor={colors.text.veryLightGray}
                value={searchInput}
                onChangeText={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={() => setIsSearchFocused(false)}
                onSubmitEditing={() => handleSearchSubmit(searchInput)}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput("");
                    setActiveSearch("");
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View
                    style={[
                      styles.clearCircle,
                      { backgroundColor: colors.text.veryLightGray + "38" },
                    ]}
                  >
                    <Ionicons name="close" size={11} color={colors.text.mediumGray} />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Cancel — slides in on focus, unmounts on blur via LayoutAnimation */}
            {isSearchFocused && (
              <Animated.View
                style={[
                  styles.cancelWrap,
                  { opacity: cancelOpacity, transform: [{ translateX: cancelSlide }] },
                ]}
              >
                <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
                  <Text style={[styles.cancelText, { color: colors.primary }]}>
                    {String(i18n.t("cancel") || "Cancel")}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>

      {/* ── Suggestions Overlay ── */}
      {showSuggestions && (
        <Animated.View
          style={[
            styles.suggestionsOverlay,
            {
              top: HEADER_HEIGHT,
              opacity: suggestionsOpacity,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.sugSection}>
                <View style={styles.sugHeader}>
                  <Text style={[styles.sugLabel, { color: colors.text.mediumGray }]}>
                    RECENT
                  </Text>
                  <TouchableOpacity onPress={clearAllRecent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.sugClear, { color: colors.primary }]}>
                      {String(i18n.t("clear") || "Clear")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {recentSearches.map((s, i) => (
                  <TouchableOpacity
                    key={`r-${i}`}
                    style={[styles.sugItem, { borderBottomColor: colors.borderLight }]}
                    onPress={() => {
                      setSearchInput(s);
                      handleSearchSubmit(s);
                    }}
                    activeOpacity={0.65}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.text.mediumGray}
                      style={{ marginRight: 14 }}
                    />
                    <Text
                      style={[styles.sugItemText, { color: colors.text.gray }]}
                      numberOfLines={1}
                    >
                      {s}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeRecentSearch(s)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={15} color={colors.text.veryLightGray} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Trending Searches */}
            <View style={styles.sugSection}>
              <View style={styles.sugHeader}>
                <View style={styles.sugHeaderRow}>
                  <Ionicons name="trending-up" size={15} color={colors.primary} />
                  <Text style={[styles.sugLabel, { color: colors.text.mediumGray, marginLeft: 6 }]}>
                    {String(i18n.t("trending") || "TRENDING").toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.trendRow}>
                {TRENDING.map((term, i) => (
                  <TouchableOpacity
                    key={`t-${i}`}
                    style={[
                      styles.trendChip,
                      {
                        backgroundColor: colors.primary + "10",
                        borderColor: colors.primary + "30",
                      },
                    ]}
                    onPress={() => {
                      setSearchInput(term);
                      handleSearchSubmit(term);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.trendChipText, { color: colors.primary }]}>
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ── Floating Filter Bar ── */}
      {!showSuggestions && (
        <View style={[styles.fab, { bottom: insets.bottom + 18 }]}>
          <BlurView
            intensity={85}
            tint={isDark ? "dark" : "light"}
            style={[styles.fabBar, { borderColor: colors.borderLight + "55" }]}
          >
            <View style={[styles.fabInner, { backgroundColor: colors.cardBackground + "72" }]}>

              {/* Filter */}
              <TouchableOpacity
                style={[
                  styles.fabBtn,
                  hasActiveFilters && { backgroundColor: colors.primary + "15" },
                ]}
                onPress={openFilterModal}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={hasActiveFilters ? colors.primary : colors.text.gray}
                />
                <Text style={[styles.fabBtnText, { color: hasActiveFilters ? colors.primary : colors.text.gray }]}>
                  {String(i18n.t("filter") || "Filter")}
                </Text>
                {hasActiveFilters && (
                  <Animated.View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: colors.primary,
                        transform: [{ scale: filterBadgeScale }],
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>!</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>

              <View style={[styles.fabDivider, { backgroundColor: colors.borderLight }]} />

              {/* Sort */}
              <TouchableOpacity
                style={[
                  styles.fabBtn,
                  sort !== "recommended" && { backgroundColor: colors.primary + "15" },
                ]}
                onPress={() => {
                  const cycle: ExploreSort[] = [
                    "recommended", "price_low", "price_high", "trending", "new",
                  ];
                  const next = cycle[(cycle.indexOf(sort) + 1) % cycle.length] ?? "recommended";
                  handleSortChange(next);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={getSortIcon()}
                  size={18}
                  color={sort !== "recommended" ? colors.primary : colors.text.gray}
                />
                <Text style={[styles.fabBtnText, { color: sort !== "recommended" ? colors.primary : colors.text.gray }]}>
                  {getSortLabel()}
                </Text>
              </TouchableOpacity>

              {/* Clear filters shortcut */}
              {hasActiveFilters && (
                <>
                  <View style={[styles.fabDivider, { backgroundColor: colors.borderLight }]} />
                  <TouchableOpacity
                    style={styles.fabClearBtn}
                    onPress={() => {
                      useExploreStore.getState().clearFilters();
                      setFilterCategory(null);
                      setShowAvailableOnly(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.danger || colors.error} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </BlurView>
        </View>
      )}

      {/* ── Filter Modal ── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeFilterModal}>
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: colors.background || colors.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <View style={styles.dragRow}>
              <View style={[styles.drag, { backgroundColor: colors.borderMedium }]} />
            </View>

            {/* Header */}
            <View style={[styles.modalHead, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: colors.text.gray }]}>
                {String(i18n.t("filterOptions") || "Filter & Sort")}
              </Text>
              <TouchableOpacity
                onPress={closeFilterModal}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={19} color={colors.text.mediumGray} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Category */}
              <View style={styles.mSection}>
                <Text style={[styles.mSectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t("category") || "Category")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      !filterCategory
                        ? { backgroundColor: colors.primary + "15", borderColor: colors.primary }
                        : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    ]}
                    onPress={() => setFilterCategory(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="apps-outline"
                      size={15}
                      color={!filterCategory ? colors.primary : colors.text.mediumGray}
                    />
                    <Text style={[styles.chipText, { color: !filterCategory ? colors.primary : colors.text.gray }]}>
                      {String(i18n.t("all") || "All")}
                    </Text>
                  </TouchableOpacity>

                  {categories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.chip,
                        filterCategory === cat._id
                          ? { backgroundColor: colors.primary + "15", borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ]}
                      onPress={() => setFilterCategory(cat._id)}
                      activeOpacity={0.7}
                    >
                      {cat.image ? (
                        <Image
                          source={{ uri: cat.image }}
                          style={{ width: 15, height: 15, borderRadius: 7 }}
                        />
                      ) : (
                        <Ionicons
                          name="grid-outline"
                          size={15}
                          color={filterCategory === cat._id ? colors.primary : colors.text.mediumGray}
                        />
                      )}
                      <Text style={[styles.chipText, { color: filterCategory === cat._id ? colors.primary : colors.text.gray }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* In-stock toggle */}
              <TouchableOpacity
                style={[styles.toggleRow, { backgroundColor: colors.surface }]}
                onPress={() => setShowAvailableOnly((p) => !p)}
                activeOpacity={0.7}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIconWrap, { backgroundColor: colors.success + "15" }]}>
                    <Ionicons name="checkmark-circle" size={19} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.toggleLabel, { color: colors.text.gray }]}>
                      {String(i18n.t("availableOnly") || "In Stock Only")}
                    </Text>
                    <Text style={[styles.toggleSub, { color: colors.text.veryLightGray }]}>
                      Show only available items
                    </Text>
                  </View>
                </View>
                <View style={[styles.track, { backgroundColor: showAvailableOnly ? colors.primary : colors.borderMedium }]}>
                  <View style={[styles.thumb, { transform: [{ translateX: showAvailableOnly ? 20 : 2 }] }]} />
                </View>
              </TouchableOpacity>

              {/* Sort options */}
              <View style={styles.mSection}>
                <Text style={[styles.mSectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t("sortByPrice") || "Sort By")}
                </Text>
                <View style={styles.sortGrid}>
                  {(
                    [
                      { key: "recommended",  icon: "sparkles-outline",    label: i18n.t("recommended") || "Recommended" },
                      { key: "price_low",    icon: "arrow-up-outline",    label: i18n.t("lowestPrice") || "Price: Low" },
                      { key: "price_high",   icon: "arrow-down-outline",  label: i18n.t("highestPrice") || "Price: High" },
                      { key: "trending",     icon: "trending-up-outline", label: i18n.t("trending") || "Trending" },
                    ] as const
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.sortCard,
                        sort === opt.key
                          ? { backgroundColor: colors.primary + "15", borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ]}
                      onPress={() => handleSortChange(opt.key as ExploreSort)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={21}
                        color={sort === opt.key ? colors.primary : colors.text.mediumGray}
                      />
                      <Text style={[styles.sortCardText, { color: sort === opt.key ? colors.primary : colors.text.gray }]}>
                        {String(opt.label)}
                      </Text>
                      {sort === opt.key && (
                        <View style={[styles.sortCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.modalActions, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                onPress={clearAllFilters}
                style={[styles.clearFilterBtn, { borderColor: colors.borderMedium }]}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.text.gray} />
                <Text style={[styles.clearFilterText, { color: colors.text.gray }]}>
                  {String(i18n.t("clear") || "Reset")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyFilters}
                style={styles.applyFilterBtn}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyGrad}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.applyText}>
                    {String(i18n.t("applyFilters") || "Apply")}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // List
  listContent: { paddingHorizontal: 12 },
  emptyList: { flex: 1 },
  row: { justifyContent: "space-between", gap: 8, marginBottom: 8 },

  // Skeleton
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap" },

  // Footer
  footer: { alignItems: "center", paddingVertical: 24, gap: 8 },
  footerLine: { width: 34, height: 3, borderRadius: 2 },
  footerText: { fontSize: 13, fontWeight: "500" },

  // Empty state
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 19, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  retryText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  headerBlur: { borderBottomWidth: StyleSheet.hairlineWidth },
  headerInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
    justifyContent: "flex-end",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 44,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelWrap: { marginLeft: 10 },
  cancelText: { fontSize: 16, fontWeight: "500" },

  // Suggestions
  suggestionsOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  sugSection: { paddingHorizontal: 20, paddingTop: 24 },
  sugHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sugHeaderRow: { flexDirection: "row", alignItems: "center" },
  sugLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  sugClear: { fontSize: 14, fontWeight: "500" },
  sugItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sugItemText: { flex: 1, fontSize: 16 },
  trendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingTop: 4 },
  trendChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  trendChipText: { fontSize: 14, fontWeight: "500" },

  // Floating filter bar
  fab: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 80 },
  fabBar: {
    borderRadius: 30,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 30,
  },
  fabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 7,
    minHeight: 44,
  },
  fabBtnText: { fontSize: 14, fontWeight: "600" },
  fabDivider: { width: 1, height: 22, marginHorizontal: 2 },
  fabClearBtn: {
    padding: 10,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingBottom: 28,
  },
  dragRow: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  drag: { width: 38, height: 4, borderRadius: 2 },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 19, fontWeight: "700" },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { paddingHorizontal: 20 },
  mSection: { marginTop: 22 },
  mSectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 13 },
  chipRow: { gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 40,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  toggleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 15, fontWeight: "600" },
  toggleSub: { fontSize: 12, marginTop: 2 },
  track: { width: 46, height: 27, borderRadius: 14, justifyContent: "center" },
  thumb: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },

  // Sort grid
  sortGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sortCard: {
    width: "48%",
    paddingVertical: 15,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 7,
    position: "relative",
  },
  sortCardText: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  sortCheck: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 19,
    height: 19,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal actions
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
  },
  clearFilterBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  clearFilterText: { fontSize: 14, fontWeight: "600" },
  applyFilterBtn: {
    flex: 0.6,
    borderRadius: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  applyGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 7,
  },
  applyText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

export default ExploreScreen;
