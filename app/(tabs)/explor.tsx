import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  View, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator, 
  ScrollView,
  Modal,
  Pressable
} from "react-native";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from 'expo-linear-gradient';
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

type Product = NormalizedProduct;

const SearchPage = () => {
  const params = useLocalSearchParams<{ sort?: string; discounted?: string; recommendation?: string; categoryId?: string }>();
  const { theme } = useTheme();
  const colors = theme.colors;
  const { trackEvent } = useTracking();
  const { setProduct } = useItemStore();
  
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
        handleProductView(item);
        navigateToProduct(item.id, item as any);
        setProduct(item);
      }}
      showWishlist={false}
    />
  ), [handleProductView, setProduct]);

  const keyExtractor = useCallback((item: Product) => item.id || Math.random().toString(), []);

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

  // Empty component
  const ListEmptyComponent = useCallback(() => {
    if (isLoading || categoriesLoading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.veryLightGray }]}>
            {i18n.t('loading') || 'Loading'}
          </Text>
        </View>
      );
    }
    
    if (exploreError && !isLoading) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.danger || colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
            {String(i18n.t('error') || 'Error')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
            {String(exploreError || '')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.white }]}>
              {String(i18n.t('retry') || 'Retry')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={60} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
          {String(searchTerm ? (i18n.t('noResults') || 'No Results') : (i18n.t('noProducts') || 'No Products'))}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
          {String(searchTerm 
            ? (i18n.t('tryNewSearch') || 'Try a new search') 
            : (i18n.t('noProductsFound') || 'No products found')
          )}
        </Text>
      </View>
    );
  }, [searchTerm, isLoading, categoriesLoading, exploreError, onRefresh, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
          {pageTitle !== 'Explore' && (
            <View style={styles.headerTop}>
              <Text style={[styles.headerTitle, { color: colors.text.gray }]}>
                {pageTitle}
              </Text>
            </View>
          )}
          
          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="search" size={20} color={colors.text.mediumGray} style={styles.searchIcon} />
            <TextInput
              placeholder={i18n.t('searchProducts')}
              style={[styles.searchInput, { color: colors.text.gray }]}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.text.veryLightGray}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.searchClearButton}>
                <Ionicons name="close-circle" size={20} color={colors.text.lightGray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter and Sort */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}
              onPress={openFilterModal}
            >
              <Ionicons name="funnel-outline" size={18} color={colors.primary} />
              <Text style={[styles.filterText, { color: colors.primary }]}>
                {String(i18n.t('filter') || 'Filter')}
              </Text>
              {(showAvailableOnly || filterCategory) && (
                <View style={[styles.filterBadge, { backgroundColor: colors.danger || colors.primary }]} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortButton, { borderColor: colors.primary }]}
              onPress={() => {
                if (sort === 'recommended') handleSortChange('price_low');
                else if (sort === 'price_low') handleSortChange('price_high');
                else handleSortChange('recommended');
              }}
            >
              <Ionicons 
                name={sort === 'price_high' ? "arrow-down" : sort === 'price_low' ? "arrow-up" : "funnel-outline"} 
                size={18} 
                color={colors.primary} 
              />
              <Text style={[styles.sortText, { color: colors.primary }]}>
                {String(
                  sort === 'price_high' ? (i18n.t('highestPrice') || 'Highest Price') : 
                  sort === 'price_low' ? (i18n.t('lowestPrice') || 'Lowest Price') : 
                  sort === 'trending' ? (i18n.t('trending') || 'Trending') :
                  sort === 'new' ? (i18n.t('newArrivals') || 'New Arrivals') :
                  sort === 'best_sellers' ? (i18n.t('bestSellers') || 'Best Sellers') :
                  sort === 'rating' ? (i18n.t('topRated') || 'Top Rated') :
                  (i18n.t('sort') || 'Sort')
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContainer,
            filteredProducts.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
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
                  {String(i18n.t('loading') || 'Loading')}
                </Text>
              </View>
            ) : !hasMore && filteredProducts.length > 0 ? (
              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: colors.text.lightGray }]}>
                  {String(i18n.t('allProductsShown') || 'All products shown')}
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

        {/* Filter Modal */}
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.modalTitle, { color: colors.text.gray }]}>
                  {String(i18n.t('filterOptions') || 'Filter Options')}
                </Text>
                <TouchableOpacity onPress={closeFilterModal}>
                  <Ionicons name="close" size={24} color={colors.text.mediumGray} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={true}>
              {/* Available Only */}
              <TouchableOpacity
                style={[styles.filterOption, { backgroundColor: colors.surface }]}
                onPress={() => setShowAvailableOnly(prev => !prev)}
              >
                <View style={styles.filterOptionLeft}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.filterOptionText, { color: colors.text.gray }]}>
                    {String(i18n.t('availableOnly') || 'Available Only')}
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  { borderColor: colors.borderMedium },
                  showAvailableOnly && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                ]}>
                  {showAvailableOnly && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t('sortByPrice') || 'Sort By Price')}
                </Text>
                
                {['price_high', 'price_low', 'recommended', 'trending'].map((sortOption) => (
                  <TouchableOpacity
                    key={sortOption}
                    style={[styles.filterOption, { backgroundColor: colors.surface }]}
                    onPress={() => handleSortChange(sortOption as ExploreSort)}
                  >
                    <View style={styles.filterOptionLeft}>
                      <Ionicons 
                        name={
                          sortOption === 'price_high' ? "arrow-down-outline" :
                          sortOption === 'price_low' ? "arrow-up-outline" :
                          sortOption === 'recommended' ? "sparkles-outline" :
                          "trending-up-outline"
                        } 
                        size={20} 
                        color={colors.primary} 
                      />
                      <Text style={[styles.filterOptionText, { color: colors.text.gray }]}>
                        {String(
                          sortOption === 'price_high' ? (i18n.t('highestPrice') || 'Highest Price') :
                          sortOption === 'price_low' ? (i18n.t('lowestPrice') || 'Lowest Price') :
                          sortOption === 'recommended' ? (i18n.t('recommended') || 'Recommended') :
                          (i18n.t('trending') || 'Trending')
                        )}
                      </Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      { borderColor: colors.borderMedium },
                      sort === sortOption && [styles.checkboxActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}>
                      {sort === sortOption && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
                  {String(i18n.t('filterByCategory') || 'Filter By Category')}
                </Text>
                <ScrollView 
                  style={styles.categoryScroll} 
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryOption,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      !filterCategory && [styles.categoryOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                    ]}
                    onPress={() => setFilterCategory(null)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      { color: !filterCategory ? colors.text.white : colors.text.gray }
                    ]}>
                      {String(i18n.t('allCategories') || 'All Categories')}
                    </Text>
                  </TouchableOpacity>
                  {flatCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.categoryOption,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                        filterCategory === cat._id && [styles.categoryOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      ]}
                      onPress={() => setFilterCategory(cat._id)}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        { color: filterCategory === cat._id ? colors.text.white : colors.text.gray }
                      ]}>
                        {String(cat.name || 'Category')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  onPress={clearAllFilters} 
                  style={[styles.clearButton, { borderColor: colors.borderMedium, backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.clearButtonText, { color: colors.text.gray }]}>
                    {String(i18n.t('clear') || 'Clear')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={applyFilters} 
                  style={styles.applyButton}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark || colors.primary]}
                    style={styles.applyButtonGradient}
                  >
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
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    marginBottom: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    textAlign: 'right',
  },
  searchClearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
  },
  filterText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 12,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionText: {
    marginLeft: 12,
    fontSize: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    // backgroundColor and borderColor set inline
  },
  categoryScroll: {
    maxHeight: 150,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
  },
  categoryOptionActive: {
    // backgroundColor and borderColor set inline
  },
  categoryOptionText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  applyButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
});

export default SearchPage;
