import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useExploreStore } from "@/store/useExploreStore";
import useCategoryStore from "@/store/useCategoryStore";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { navigateToProduct } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { ExploreSort } from "@/api/explore.api";
import useItemStore from "@/store/useItemStore";
import ProductCard from "@/components/ProductCard";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { markTapStart, markNavigationCall } from "@/utils/performance";

type Product = NormalizedProduct;

const SearchPage = () => {
  const params = useLocalSearchParams<{ sort?: string; discounted?: string; recommendation?: string; categoryId?: string }>();
  const { theme } = useTheme();
  const colors = theme.colors;
  const { trackEvent } = useTracking();
  const setProduct = useItemStore((state: any) => state.setProduct);

  // Explore store
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

  // Category store
  const { categories, fetchCategories, loading: categoriesLoading } = useCategoryStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Animation for filter badge
  const filterBadgeAnim = useMemo(() => new Animated.Value(0), []);

  // Scroll animation for collapsible header
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const HEADER_HEIGHT = 110; // Fixed header height

  // Animated values for header collapse - using translateY for native driver support
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animate filter badge when filters are active
  useEffect(() => {
    const hasActiveFilters = showAvailableOnly || filterCategory || filters.category || filters.inStock;
    Animated.spring(filterBadgeAnim, {
      toValue: hasActiveFilters ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [showAvailableOnly, filterCategory, filters.category, filters.inStock]);

  // Page title
  const pageTitle = useMemo(() => {
    if (params.discounted === 'true') return i18n.t('flashDeals') || 'Flash Deals';
    if (params.sort === 'trending') return i18n.t('trending') || 'Trending';
    if (params.sort === 'new') return i18n.t('newArrivals') || 'New Arrivals';
    if (params.sort === 'best') return i18n.t('bestSellers') || 'Best Sellers';
    if (params.sort === 'rating') return i18n.t('topRated') || 'Top Rated';
    if (params.recommendation === 'home') return i18n.t('forYou') || 'For You';
    return i18n.t('explore') || 'Explore';
  }, [params]);

  // Handlers
  const handleProductView = useCallback((product: Product) => {
    trackEvent("product_view", {
      productId: product.id,
      categoryId: product.categoryId,
      screen: "explore",
    });
  }, [trackEvent]);

  const handleSortChange = useCallback((newSort: ExploreSort) => {
    trackEvent('sort_change', { sort: newSort, screen: 'explore' });
    setSort(newSort);
  }, [trackEvent, setSort]);

  const openFilterModal = useCallback(() => {
    setFilterCategory(filters.category || null);
    setShowAvailableOnly(filters.inStock === true);
    setShowFilterModal(true);
  }, [filters]);

  const closeFilterModal = useCallback(() => {
    setShowFilterModal(false);
  }, []);

  const applyFilters = useCallback(() => {
    const newFilters: any = {};
    if (filterCategory) newFilters.category = filterCategory;
    if (showAvailableOnly) newFilters.inStock = true;
    if (params.discounted === 'true') newFilters.discount = true;

    trackEvent('filter_apply', { filters: JSON.stringify(newFilters), screen: 'explore' });
    closeFilterModal();
    setFilters(newFilters);
  }, [filterCategory, showAvailableOnly, params.discounted, setFilters, trackEvent, closeFilterModal]);

  const clearAllFilters = useCallback(() => {
    setFilterCategory(null);
    setShowAvailableOnly(false);
    trackEvent('filter_clear', { screen: 'explore' });
    closeFilterModal();
    useExploreStore.getState().clearFilters();
  }, [trackEvent, closeFilterModal]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    trackEvent('explore_load_more', { screen: 'explore' });
    await loadMoreProducts();
  }, [isLoadingMore, hasMore, loadMoreProducts, trackEvent]);

  const onRefresh = useCallback(async () => {
    trackEvent('explore_refresh', { screen: 'explore' });
    await refreshProducts();
  }, [refreshProducts, trackEvent]);

  // Initial load
  useEffect(() => {
    const initializeExplore = async () => {
      fetchCategories();

      const initialSort: ExploreSort =
        params.sort === 'trending' ? 'trending' :
          params.sort === 'new' ? 'new' :
            params.sort === 'best' ? 'best_sellers' :
              params.sort === 'rating' ? 'rating' :
                params.discounted === 'true' ? 'recommended' :
                  'recommended';

      const initialFilters: any = {};
      if (params.categoryId) initialFilters.category = params.categoryId;
      if (params.discounted === 'true') initialFilters.discount = true;

      await fetchProducts({
        ...initialFilters,
        sort: initialSort,
        page: 1,
      });

      trackEvent('explore_view', { screen: 'explore', sort: initialSort });
    };

    initializeExplore();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter((product: Product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [products, searchTerm]);

  // Render item
  const renderItem = useCallback(({ item }: { item: Product; index: number }) => (
    <ProductCard
      item={item}
      onPress={() => {
        if (__DEV__) markTapStart(item.id);
        handleProductView(item);
        navigateToProduct(item.id, item as any);
        if (__DEV__) markNavigationCall(item.id);
        setProduct(item);
      }}
      showWishlist={false}
    />
  ), [handleProductView, setProduct]);

  const keyExtractor = useCallback((item: Product, index: number) => {
    return item.id || `product-${index}`;
  }, []);

  // Flatten categories
  const flatCategories = useMemo(() => {
    const flatten = (cats: any[]): { _id: string, name: string }[] => {
      let result: { _id: string, name: string }[] = [];
      cats.forEach(cat => {
        result.push({ _id: cat._id || '', name: String(cat.name || 'Category') });
        if (cat.children?.length) {
          result = result.concat(flatten(cat.children));
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  // Get sort display text
  const getSortLabel = useCallback(() => {
    switch (sort) {
      case 'price_high': return i18n.t('highestPrice') || 'High to Low';
      case 'price_low': return i18n.t('lowestPrice') || 'Low to High';
      case 'trending': return i18n.t('trending') || 'Trending';
      case 'new': return i18n.t('newArrivals') || 'New';
      case 'best_sellers': return i18n.t('bestSellers') || 'Best Sellers';
      case 'rating': return i18n.t('topRated') || 'Top Rated';
      default: return i18n.t('sort') || 'Sort';
    }
  }, [sort]);

  // Get sort icon
  const getSortIcon = useCallback(() => {
    switch (sort) {
      case 'price_high': return 'arrow-down';
      case 'price_low': return 'arrow-up';
      case 'trending': return 'trending-up';
      case 'new': return 'sparkles';
      default: return 'swap-vertical';
    }
  }, [sort]);

  // Empty component
  const ListEmptyComponent = useCallback(() => {
    if (isLoading || categoriesLoading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: 'transparent' }]}>
          <View style={[styles.loadingIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.text.gray }]}>
            {i18n.t('loading') || 'Loading products...'}
          </Text>
        </View>
      );
    }

    if (exploreError && !isLoading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: 'transparent' }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: (colors.danger || colors.primary) + '15' }]}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.danger || colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
            {String(i18n.t('error') || 'Something went wrong')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
            {String(exploreError || 'Please try again')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>
              {String(i18n.t('retry') || 'Try Again')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.emptyContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name={searchTerm ? "search" : "bag-outline"} size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
          {String(searchTerm ? (i18n.t('noResults') || 'No Results Found') : (i18n.t('noProducts') || 'No Products Yet'))}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
          {String(searchTerm
            ? (i18n.t('tryNewSearch') || 'Try adjusting your search')
            : (i18n.t('noProductsFound') || 'Check back later for new arrivals')
          )}
        </Text>
      </View>
    );
  }, [searchTerm, isLoading, categoriesLoading, exploreError, onRefresh, colors]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.category || filters.inStock || showAvailableOnly || filterCategory;
  }, [filters, showAvailableOnly, filterCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Collapsible Header */}
      <Animated.View style={[
        styles.headerWrapper,
        {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
        }
      ]}>
        <LinearGradient
          colors={[colors.primary + '12', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.header}>
          {/* Page Title */}
          {pageTitle !== 'Explore' && (
            <View style={styles.headerTop}>
              <Text style={[styles.headerTitle, { color: colors.text.gray }]}>
                {pageTitle}
              </Text>
            </View>
          )}

          {/* Elevated Search Bar */}
          <View style={[
            styles.searchContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.primary,
              shadowColor: colors.shadow,
            }
          ]}>
            <Ionicons
              name="search"
              size={20}
              color={isSearchFocused ? colors.primary : colors.text.mediumGray}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder={i18n.t('searchProducts') || 'Search products...'}
              style={[styles.searchInput, { color: colors.text.gray }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.text.veryLightGray}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm("")}
                style={styles.searchClearButton}
                activeOpacity={0.7}
              >
                <View style={[styles.clearButtonInner, { backgroundColor: colors.text.veryLightGray + '30' }]}>
                  <Ionicons name="close" size={14} color={colors.text.mediumGray} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Products List */}
      <Animated.FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContainer,
          filteredProducts.length === 0 && styles.emptyListContainer,
          { paddingBottom: 100 } // Space for floating bar
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        numColumns={2}
        columnWrapperStyle={filteredProducts.length > 0 ? styles.columnWrapper : undefined}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.footerText, { color: colors.text.lightGray }]}>
                {String(i18n.t('loading') || 'Loading more...')}
              </Text>
            </View>
          ) : !hasMore && filteredProducts.length > 0 ? (
            <View style={styles.footerContainer}>
              <View style={[styles.footerDivider, { backgroundColor: colors.borderLight }]} />
              <Text style={[styles.footerText, { color: colors.text.veryLightGray }]}>
                {String(i18n.t('allProductsShown') || "You've seen it all!")}
              </Text>
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={6}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
      />

      {/* Floating Filter Bar at Bottom Center - Liquid Glass */}
      <View style={styles.floatingFilterContainer}>
        <BlurView
          intensity={80}
          tint="light"
          style={[
            styles.floatingFilterBar,
            {
              borderColor: colors.borderLight + '50',
            }
          ]}
        >
          <View style={[styles.floatingFilterInner, { backgroundColor: colors.cardBackground + '70' }]}>
            {/* Filter Button */}
            <TouchableOpacity
              style={[
                styles.floatingFilterButton,
                hasActiveFilters && { backgroundColor: colors.primary + '15' }
              ]}
              onPress={openFilterModal}
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={hasActiveFilters ? colors.primary : colors.text.gray}
              />
              <Text style={[
                styles.floatingFilterText,
                { color: hasActiveFilters ? colors.primary : colors.text.gray }
              ]}>
                {String(i18n.t('filter') || 'Filter')}
              </Text>
              {hasActiveFilters && (
                <View style={[styles.floatingBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.floatingBadgeText}>!</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.floatingDivider, { backgroundColor: colors.borderLight }]} />

            {/* Sort Button */}
            <TouchableOpacity
              style={[
                styles.floatingFilterButton,
                sort !== 'recommended' && { backgroundColor: colors.primary + '15' }
              ]}
              onPress={() => {
                if (sort === 'recommended') handleSortChange('price_low');
                else if (sort === 'price_low') handleSortChange('price_high');
                else if (sort === 'price_high') handleSortChange('trending');
                else if (sort === 'trending') handleSortChange('new');
                else handleSortChange('recommended');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getSortIcon() as any}
                size={20}
                color={sort !== 'recommended' ? colors.primary : colors.text.gray}
              />
              <Text style={[
                styles.floatingFilterText,
                { color: sort !== 'recommended' ? colors.primary : colors.text.gray }
              ]}>
                {getSortLabel()}
              </Text>
            </TouchableOpacity>

            {/* Clear Button (when filters active) */}
            {hasActiveFilters && (
              <>
                <View style={[styles.floatingDivider, { backgroundColor: colors.borderLight }]} />
                <TouchableOpacity
                  style={styles.floatingClearButton}
                  onPress={() => {
                    useExploreStore.getState().clearFilters();
                    setFilterCategory(null);
                    setShowAvailableOnly(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      </View>

      {/* Premium Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={closeFilterModal}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background || '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Indicator */}
            <View style={styles.dragIndicatorContainer}>
              <View style={[styles.dragIndicator, { backgroundColor: colors.borderMedium }]} />
            </View>

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.modalTitle, { color: colors.text.gray }]}>
                {String(i18n.t('filterOptions') || 'Filter & Sort')}
              </Text>
              <TouchableOpacity
                onPress={closeFilterModal}
                style={[styles.modalCloseButton, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.text.mediumGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Available Only Toggle */}
              <TouchableOpacity
                style={[styles.filterOption, { backgroundColor: colors.surface }]}
                onPress={() => setShowAvailableOnly(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.filterOptionLeft}>
                  <View style={[styles.filterOptionIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.filterOptionText, { color: colors.text.gray }]}>
                      {String(i18n.t('availableOnly') || 'In Stock Only')}
                    </Text>
                    <Text style={[styles.filterOptionSubtext, { color: colors.text.veryLightGray }]}>
                      Show only available items
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.toggleTrack,
                  { backgroundColor: showAvailableOnly ? colors.primary : colors.borderMedium }
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: '#fff',
                      transform: [{ translateX: showAvailableOnly ? 20 : 2 }]
                    }
                  ]} />
                </View>
              </TouchableOpacity>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t('sortByPrice') || 'Sort By')}
                </Text>

                <View style={styles.sortOptionsGrid}>
                  {[
                    { key: 'recommended', icon: 'sparkles-outline', label: i18n.t('recommended') || 'Recommended' },
                    { key: 'price_low', icon: 'arrow-up-outline', label: i18n.t('lowestPrice') || 'Price: Low' },
                    { key: 'price_high', icon: 'arrow-down-outline', label: i18n.t('highestPrice') || 'Price: High' },
                    { key: 'trending', icon: 'trending-up-outline', label: i18n.t('trending') || 'Trending' },
                  ].map((sortOption) => (
                    <TouchableOpacity
                      key={sortOption.key}
                      style={[
                        styles.sortOptionCard,
                        {
                          backgroundColor: sort === sortOption.key ? colors.primary + '15' : colors.surface,
                          borderColor: sort === sortOption.key ? colors.primary : colors.borderLight,
                        }
                      ]}
                      onPress={() => handleSortChange(sortOption.key as ExploreSort)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={sortOption.icon as any}
                        size={22}
                        color={sort === sortOption.key ? colors.primary : colors.text.mediumGray}
                      />
                      <Text style={[
                        styles.sortOptionText,
                        { color: sort === sortOption.key ? colors.primary : colors.text.gray }
                      ]}>
                        {String(sortOption.label)}
                      </Text>
                      {sort === sortOption.key && (
                        <View style={[styles.sortOptionCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t('filterByCategory') || 'Categories')}
                </Text>
                <ScrollView
                  style={styles.categoryScroll}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: !filterCategory ? colors.primary : colors.surface,
                        borderColor: !filterCategory ? colors.primary : colors.borderLight,
                      }
                    ]}
                    onPress={() => setFilterCategory(null)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="apps"
                      size={16}
                      color={!filterCategory ? '#fff' : colors.text.mediumGray}
                    />
                    <Text style={[
                      styles.categoryChipText,
                      { color: !filterCategory ? '#fff' : colors.text.gray }
                    ]}>
                      {String(i18n.t('allCategories') || 'All')}
                    </Text>
                  </TouchableOpacity>
                  {flatCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: filterCategory === cat._id ? colors.primary : colors.surface,
                          borderColor: filterCategory === cat._id ? colors.primary : colors.borderLight,
                        }
                      ]}
                      onPress={() => setFilterCategory(cat._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        { color: filterCategory === cat._id ? '#fff' : colors.text.gray }
                      ]}>
                        {String(cat.name || 'Category')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.modalActions, { borderTopColor: colors.borderLight }]}>
              <TouchableOpacity
                onPress={clearAllFilters}
                style={[styles.clearButton, { borderColor: colors.borderMedium }]}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.text.gray} />
                <Text style={[styles.clearButtonText, { color: colors.text.gray }]}>
                  {String(i18n.t('clear') || 'Reset')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyFilters}
                style={styles.applyButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark || colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyButtonGradient}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.applyButtonText}>
                    {String(i18n.t('applyFilters') || 'Apply Filters')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header styles
  headerWrapper: {
    position: 'relative',
    paddingTop: 44,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTop: {
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 42,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    paddingVertical: 0,
  },
  searchClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter pills
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
  },
  filterPillText: {
    fontWeight: '600',
    fontSize: 13,
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  clearFiltersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // List styles
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Footer styles
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  footerDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
  },

  // Filter option styles
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  filterOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },

  // Toggle styles
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Section styles
  filterSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },

  // Sort options grid
  sortOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sortOptionCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortOptionCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Category scroll
  categoryScroll: {
    marginHorizontal: -20,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 6,
    minHeight: 44,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    borderTopWidth: 1,
    marginTop: 20,
  },
  clearButton: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyButton: {
    flex: 0.6,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Floating Filter Bar styles
  floatingFilterContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  floatingFilterBar: {
    borderRadius: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  floatingFilterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 28,
  },
  floatingFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 8,
    minHeight: 44,
  },
  floatingFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  floatingDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  floatingBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  floatingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingClearButton: {
    padding: 10,
    borderRadius: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchPage;
