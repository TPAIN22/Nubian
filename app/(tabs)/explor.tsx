import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, Modal, ScrollView, Animated, StatusBar } from "react-native";
import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import useItemStore from "@/store/useItemStore";
import useCategoryStore from "@/store/useCategoryStore";
// import { useSmartSystems } from "@/providers/SmartSystemsProvider";
import styles from "../components/styles";
import i18n from "@/utils/i18n";
import { useFocusEffect } from '@react-navigation/native';
import CategoryAccordion from "../components/CategoryAccordion";
import React from "react";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  category?: string | { parent?: string };
  stock?: number;
}

const DEFAULT_IMAGE = "https://placehold.jp/3d4070/ffffff/150x150.png";
const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 20;

// Separate ProductCard component to handle animations properly
const ProductCard = React.memo(({ item, index, onPress, getCardAnimation, animateCard, onAddToCart }: {
  item: Product;
  index: number;
  onPress: () => void;
  getCardAnimation: (id: string) => Animated.Value;
  animateCard: (id: string, delay: number) => void;
  onAddToCart: (product: Product) => void;
}) => {
  const cardAnim = getCardAnimation(item._id);
  
  // Use useLayoutEffect instead of useEffect to avoid hook call issues
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      animateCard(item._id, index * 50);
    }, index * 50);
    
    return () => clearTimeout(timer);
  }, [item._id, index, animateCard]);

  return (
    <Animated.View
      style={[
        enhancedStyles.cardContainer,
        {
          opacity: cardAnim,
          transform: [
            {
              translateY: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
            {
              scale: cardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={enhancedStyles.cardImageContainer}>
          <Image
            source={{ uri: item.images?.[0] || DEFAULT_IMAGE }}
            style={enhancedStyles.cardImage}
            contentFit="cover"
            transition={1000}
          />
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)']}
            style={enhancedStyles.imageGradient}
          />
          {/* Stock indicator */}
          {(item.stock || 0) <= 5 && (item.stock || 0) > 0 && (
            <View style={enhancedStyles.stockBadge}>
              <Text style={enhancedStyles.stockText}>
                {item.stock} متبقي
              </Text>
            </View>
          )}
          {/* Out of stock overlay */}
          {(item.stock || 0) === 0 && (
            <View style={enhancedStyles.outOfStockOverlay}>
              <Text style={enhancedStyles.outOfStockText}>نفد المخزون</Text>
            </View>
          )}
          {/* Favorite button */}
          <TouchableOpacity style={enhancedStyles.favoriteButton}>
            <Ionicons name="heart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={enhancedStyles.cardInfo}>
          <Text style={enhancedStyles.cardName} numberOfLines={2}>
            {item.name || 'منتج غير محدد'}
          </Text>
          
          <View style={enhancedStyles.cardBottom}>
            <View style={enhancedStyles.priceContainer}>
              <Text style={enhancedStyles.currency}>SDG</Text>
              <Text style={enhancedStyles.price}>
                {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                enhancedStyles.addButton,
                (item.stock || 0) === 0 && enhancedStyles.addButtonDisabled
              ]}
              disabled={(item.stock || 0) === 0}
              onPress={() => onAddToCart(item)}
            >
              <Ionicons 
                name="add" 
                size={18} 
                color={(item.stock || 0) === 0 ? "#999" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const SearchPage = () => {
  const router = useRouter();
  // const { trackEvent, getRecommendations, isLoading: smartSystemsLoading } = useSmartSystems();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { products, getProducts, setProduct, getAllProducts, loadMoreAllProducts, resetProducts, hasMore, isProductsLoading } = useItemStore();
  const { categories, fetchCategories, loading: categoriesLoading } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortByHighestPrice, setSortByHighestPrice] = useState(false);
  const [sortByLowestPrice, setSortByLowestPrice] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // Animation values
  const searchFocusAnim = useRef(new Animated.Value(0)).current;
  const filterModalAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(new Map()).current;

  // تتبع سلوك المستخدم عند عرض المنتج
  const handleProductView = useCallback((product: Product) => {
    // trackEvent('product_view', {
    //   productId: product._id,
    //   productName: product.name,
    //   category: typeof product.category === 'string' ? product.category : product.category?.parent,
    //   price: product.price,
    //   timestamp: new Date().toISOString()
    // });
  }, []);

  // تتبع البحث
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // trackEvent('search', {
      //   query: query.trim(),
      //   resultsCount: products.length,
      //   timestamp: new Date().toISOString()
      // });
    }
  }, [products.length]);

  // تتبع إضافة المنتج للسلة
  const handleAddToCart = useCallback((product: Product) => {
    // trackEvent('add_to_cart', {
    //   productId: product._id,
    //   productName: product.name,
    //   price: product.price,
    //   category: typeof product.category === 'string' ? product.category : product.category?.parent,
    //   timestamp: new Date().toISOString()
    // });
  }, []);

  // الحصول على التوصيات الذكية
  const loadRecommendations = useCallback(async () => {
    try {
      // يمكن استخدام معرف المستخدم الحالي هنا
      const userId = 'current-user-id'; // استبدل بمعرف المستخدم الحقيقي
      // const userRecommendations = getRecommendations(userId, 10);
      setRecommendations([]);
    } catch (error) {
      console.error('خطأ في تحميل التوصيات:', error);
    }
  }, []);

  // Handle search focus animation
  const handleSearchFocus = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.spring(searchFocusAnim, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  // Handle filter modal animation
  const showFilterModal = () => {
    setShowFilter(true);
    Animated.spring(filterModalAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hideFilterModal = () => {
    Animated.spring(filterModalAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start(() => setShowFilter(false));
  };

  // Get card animation
  const getCardAnimation = (id: string) => {
    if (!cardAnimations.has(id)) {
      cardAnimations.set(id, new Animated.Value(0));
    }
    return cardAnimations.get(id);
  };

  // Animate card on mount
  const animateCard = (id: string, delay = 0) => {
    const anim = getCardAnimation(id);
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      delay,
    }).start();
  };

  // Handle loading more products
  const handleLoadMore = useCallback(async () => {
    try {
      if (refreshing || isLoading || !hasMore || isProductsLoading) return;
      await loadMoreAllProducts();
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  }, [refreshing, isLoading, hasMore, isProductsLoading, loadMoreAllProducts]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      resetProducts();
      await getAllProducts();
    } catch (error) {
      console.error('Error refreshing products:', error);
    } finally {
      setRefreshing(false);
    }
  }, [resetProducts, getAllProducts]);

  // Initial load of products
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!isMounted || hasInitialized) return;
      
      setIsLoading(true);
      try {
        await Promise.all([
          getAllProducts(),
          fetchCategories(),
          loadRecommendations()
        ]);
        setHasInitialized(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [getAllProducts, fetchCategories, hasInitialized, loadRecommendations]);

  // تتبع البحث عند تغيير مصطلح البحث
  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    try {
      let tempProducts = [...(products || [])];
      
      // Filter by search term
      if (searchTerm.trim()) {
        tempProducts = tempProducts.filter((product: Product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
      }
      
      // Filter by selected category (from modal)
      if (filterCategory) {
        tempProducts = tempProducts.filter((product: Product) => {
          if (typeof product.category === 'string') {
            return product.category === filterCategory;
          } else if (product.category && typeof product.category === 'object') {
            return product.category.parent === filterCategory;
          }
          return false;
        });
      }
      
      // Filter by category from accordion (keep this for main UI)
      if (selectedCategory) {
        tempProducts = tempProducts.filter((product: Product) => {
          if (typeof product.category === 'string') {
            return product.category === selectedCategory;
          } else if (product.category && typeof product.category === 'object') {
            return product.category.parent === selectedCategory;
          }
          return false;
        });
      }
      
      // Filter by availability only
      if (showAvailableOnly) {
        tempProducts = tempProducts.filter((product: Product) => 
          (product.stock || 0) > 0
        );
      }
      
      // Sort by price
      if (sortByHighestPrice) {
        tempProducts.sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
      } else if (sortByLowestPrice) {
        tempProducts.sort((a: Product, b: Product) => (a.price || 0) - (b.price || 0));
      }
      
      return tempProducts;
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  }, [products, searchTerm, selectedCategory, showAvailableOnly, sortByHighestPrice, sortByLowestPrice, filterCategory]);

  // Render product item with enhanced design
  const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    return (
      <ProductCard
        item={item}
        index={index}
        onPress={() => {
          try {
            // تتبع عرض المنتج
            handleProductView(item);
            setProduct(item);
            router.push(`/details/${item._id}`);
          } catch (error) {
            console.error('Error navigating to product details:', error);
          }
        }}
        getCardAnimation={getCardAnimation}
        animateCard={animateCard}
        onAddToCart={handleAddToCart}
      />
    );
  }, [router, setProduct, getCardAnimation, animateCard, handleProductView, handleAddToCart]);

  const keyExtractor = useCallback((item: Product) => item._id || Math.random().toString(), []);

  const ListEmptyComponent = useCallback(() => {
    if (isLoading || categoriesLoading) {
      return (
        <View style={enhancedStyles.emptyContainer}>
          <ActivityIndicator size="large" color="#e98c22" />
          <Text style={enhancedStyles.loadingText}>جاري التحميل...</Text>
        </View>
      );
    }
    
    return (
      <View style={enhancedStyles.emptyContainer}>
        <View style={enhancedStyles.emptyIconContainer}>
          <Ionicons name="search-outline" size={60} color="#e98c22" />
        </View>
        <Text style={enhancedStyles.emptyTitle}>
          {searchTerm ? 'لا توجد نتائج' : 'لا توجد منتجات'}
        </Text>
        <Text style={enhancedStyles.emptySubtitle}>
          {searchTerm 
            ? 'جرب البحث بكلمات أخرى أو تغيير الفلاتر' 
            : 'لم يتم العثور على منتجات في الوقت الحالي'
          }
        </Text>
      </View>
    );
  }, [searchTerm, isLoading, categoriesLoading]);

  // Flatten categories tree to flat array for modal
  function flattenCategories(categories: any[]): { _id: string, name: string }[] {
    let result: { _id: string, name: string }[] = [];
    categories.forEach(cat => {
      result.push({ _id: cat._id, name: cat.name });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children));
      }
    });
    return result;
  }

  const flatCategories = flattenCategories(categories);

  return (
    <View style={enhancedStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with Search */}
      <View style={enhancedStyles.header}>
        
        
        {/* Enhanced Search Input */}
        <Animated.View 
          style={[
            enhancedStyles.searchContainer,
            {
              borderColor: searchFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['#e0e0e0', '#e98c22'],
              }),
              shadowOpacity: searchFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.1],
              }),
            }
          ]}
        >
          <Ionicons name="search" size={20} color="#666" style={enhancedStyles.searchIcon} />
          <TextInput
            placeholder="ابحث عن المنتجات..."
            style={enhancedStyles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholderTextColor="#999"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchTerm("")}
              style={enhancedStyles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter and Sort Buttons */}
        <View style={enhancedStyles.filterContainer}>
          <TouchableOpacity
            style={enhancedStyles.filterButton}
            onPress={showFilterModal}
          >
            <Ionicons name="funnel-outline" size={18} color="#e98c22" />
            <Text style={enhancedStyles.filterText}>تصفية</Text>
            {(showAvailableOnly || sortByHighestPrice || sortByLowestPrice || filterCategory) && (
              <View style={enhancedStyles.filterBadge} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={enhancedStyles.sortButton}
            onPress={() => {
              if (!sortByLowestPrice && !sortByHighestPrice) {
                setSortByLowestPrice(true);
              } else if (sortByLowestPrice) {
                setSortByLowestPrice(false);
                setSortByHighestPrice(true);
              } else {
                setSortByHighestPrice(false);
              }
            }}
          >
            <Ionicons 
              name={sortByHighestPrice ? "arrow-down" : "arrow-up"} 
              size={18} 
              color="#e98c22" 
            />
            <Text style={enhancedStyles.sortText}>
              {sortByHighestPrice ? "الأعلى سعراً" : sortByLowestPrice ? "الأقل سعراً" : "ترتيب"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showFilter}
        transparent
        animationType="none"
        onRequestClose={hideFilterModal}
      >
        <BlurView intensity={20} style={enhancedStyles.modalBlur}>
          <TouchableOpacity 
            style={enhancedStyles.modalOverlay}
            activeOpacity={1}
            onPress={hideFilterModal}
          >
            <Animated.View 
              style={[
                enhancedStyles.modalContainer,
                {
                  transform: [
                    {
                      translateY: filterModalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                      }),
                    },
                  ],
                  opacity: filterModalAnim,
                }
              ]}
            >
              <TouchableOpacity activeOpacity={1}>
                <View style={enhancedStyles.modalHeader}>
                  <Text style={enhancedStyles.modalTitle}>خيارات التصفية</Text>
                  <TouchableOpacity onPress={hideFilterModal}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={enhancedStyles.modalContent}>
                  {/* Available Only Filter */}
                  <TouchableOpacity
                    style={enhancedStyles.filterOption}
                    onPress={() => setShowAvailableOnly(prev => !prev)}
                  >
                    <View style={enhancedStyles.filterOptionLeft}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#e98c22" />
                      <Text style={enhancedStyles.filterOptionText}>المنتجات المتوفرة فقط</Text>
                    </View>
                    <View style={[
                      enhancedStyles.checkbox,
                      showAvailableOnly && enhancedStyles.checkboxActive
                    ]}>
                      {showAvailableOnly && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Sort Options */}
                  <View style={enhancedStyles.filterSection}>
                    <Text style={enhancedStyles.sectionTitle}>ترتيب حسب السعر</Text>
                    
                    <TouchableOpacity
                      style={enhancedStyles.filterOption}
                      onPress={() => {
                        setSortByHighestPrice(prev => !prev);
                        if (!sortByHighestPrice) setSortByLowestPrice(false);
                      }}
                    >
                      <View style={enhancedStyles.filterOptionLeft}>
                        <Ionicons name="arrow-down-outline" size={20} color="#e98c22" />
                        <Text style={enhancedStyles.filterOptionText}>من الأعلى للأقل</Text>
                      </View>
                      <View style={[
                        enhancedStyles.checkbox,
                        sortByHighestPrice && enhancedStyles.checkboxActive
                      ]}>
                        {sortByHighestPrice && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={enhancedStyles.filterOption}
                      onPress={() => {
                        setSortByLowestPrice(prev => !prev);
                        if (!sortByLowestPrice) setSortByHighestPrice(false);
                      }}
                    >
                      <View style={enhancedStyles.filterOptionLeft}>
                        <Ionicons name="arrow-up-outline" size={20} color="#e98c22" />
                        <Text style={enhancedStyles.filterOptionText}>من الأقل للأعلى</Text>
                      </View>
                      <View style={[
                        enhancedStyles.checkbox,
                        sortByLowestPrice && enhancedStyles.checkboxActive
                      ]}>
                        {sortByLowestPrice && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Category Filter */}
                  <View style={enhancedStyles.filterSection}>
                    <Text style={enhancedStyles.sectionTitle}>تصفية حسب التصنيف</Text>
                    <ScrollView style={enhancedStyles.categoryScroll} nestedScrollEnabled>
                      <TouchableOpacity
                        style={[
                          enhancedStyles.categoryOption,
                          !filterCategory && enhancedStyles.categoryOptionActive
                        ]}
                        onPress={() => setFilterCategory(null)}
                      >
                        <Text style={[
                          enhancedStyles.categoryOptionText,
                          !filterCategory && enhancedStyles.categoryOptionTextActive
                        ]}>
                          كل التصنيفات
                        </Text>
                      </TouchableOpacity>
                      {flatCategories.map((cat: any) => (
                        <TouchableOpacity
                          key={cat._id}
                          style={[
                            enhancedStyles.categoryOption,
                            filterCategory === cat._id && enhancedStyles.categoryOptionActive
                          ]}
                          onPress={() => setFilterCategory(cat._id)}
                        >
                          <Text style={[
                            enhancedStyles.categoryOptionText,
                            filterCategory === cat._id && enhancedStyles.categoryOptionTextActive
                          ]}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </ScrollView>

                {/* Apply Button */}
                <TouchableOpacity 
                  onPress={hideFilterModal} 
                  style={enhancedStyles.applyButton}
                >
                  <LinearGradient
                    colors={['#e98c22', '#d67b1a']}
                    style={enhancedStyles.applyButtonGradient}
                  >
                    <Text style={enhancedStyles.applyButtonText}>تطبيق الفلاتر</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          enhancedStyles.listContainer,
          filteredProducts.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        numColumns={2}
        columnWrapperStyle={filteredProducts.length > 0 ? enhancedStyles.columnWrapper : undefined}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#e98c22"]}
            tintColor="#e98c22"
          />
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          !hasMore && filteredProducts.length > 0 ? (
            <View style={enhancedStyles.footerContainer}>
              <View style={enhancedStyles.footerLine} />
              <Text style={enhancedStyles.footerText}>تم عرض جميع المنتجات</Text>
              <View style={enhancedStyles.footerLine} />
            </View>
          ) : null
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={6}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
      />
    </View>
  );
};

// Enhanced Styles
const enhancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e98c22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  filterText: {
    marginLeft: 6,
    color: '#e98c22',
    fontWeight: '600',
    fontSize: 12,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 5,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#ff4444',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e98c22',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sortText: {
    marginLeft: 4,
    color: '#e98c22',
    fontWeight: '600',
    fontSize: 12,
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
    textAlign: 'right',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e98c22',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e98c22',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e98c22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  footerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  // Modal Styles
  modalBlur: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    maxHeight: height * 0.5,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
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
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#e98c22',
    borderColor: '#e98c22',
  },
  categoryScroll: {
    maxHeight: 150,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryOptionActive: {
    backgroundColor: '#e98c22',
    borderColor: '#d67b1a',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  categoryOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#e98c22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
});

export default SearchPage;