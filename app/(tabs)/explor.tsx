import React from "react";
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, Modal, ScrollView } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import useItemStore from "@/store/useItemStore";
import useCategoryStore from "@/store/useCategoryStore";
import styles from "../components/styles";
import i18n from "@/utils/i18n";
import { useFocusEffect } from '@react-navigation/native';
import CategoryAccordion from "../components/CategoryAccordion";
// @ts-ignore
import Slider from '@react-native-community/slider';

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  category?: string | { parent?: string };
  stock?: number;
}

const DEFAULT_IMAGE = "https://placehold.jp/3d4070/ffffff/150x150.png";
const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;

const SearchPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { products, getProducts, setProduct, getAllProducts, resetProducts } = useItemStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortByHighestPrice, setSortByHighestPrice] = useState(false);
  const [sortByLowestPrice, setSortByLowestPrice] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Handle loading more products
  const handleLoadMore = useCallback(async () => {
    try {
      if (refreshing || isLoading) return;
      await getProducts();
    } catch (error) {
      console.error('Error loading more products:', error);
    }
  }, [refreshing, isLoading, getProducts]);

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
          fetchCategories()
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
  }, [getAllProducts, fetchCategories, hasInitialized]);

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
      
      // Sort by highest price if enabled
      if (sortByHighestPrice) {
        tempProducts.sort((a: Product, b: Product) => (b.price || 0) - (a.price || 0));
      }
      
      return tempProducts;
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  }, [products, searchTerm, selectedCategory, showAvailableOnly, sortByHighestPrice, filterCategory]);

  // Render product item
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.8}
      onPress={() => {
        try {
          setProduct(item);
          router.push(`/details/${item._id}`);
        } catch (error) {
          console.error('Error navigating to product details:', error);
        }
      }}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: item.images?.[0] || DEFAULT_IMAGE }}
          style={styles.cardImage}
          contentFit="cover"
          transition={1000}
        />
        <View style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color="#fff" />
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name || 'منتج غير محدد'}
        </Text>
        <View style={styles.cardBottom}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>SDG</Text>
            <Text style={styles.price}>
              {typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [router, setProduct]);

  const keyExtractor = useCallback((item: Product) => item._id || Math.random().toString(), []);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={50} color="#999" />
      <Text style={styles.noResults}>
        {searchTerm ? i18n.t('noSearchResults') : i18n.t('noProductsAvailable')}
      </Text>
    </View>
  ), [searchTerm]);

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
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder={i18n.t('searchPlaceholder')}
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#666"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Sort Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="filter" size={18} color="#e98c22" />
          <Text style={styles.filterText}>{i18n.t('filter')}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Accordion */}
      <CategoryAccordion
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={{ 
          flex: 1, 
          justifyContent: "flex-end", 
          backgroundColor: "rgba(0,0,0,0.3)" 
        }}>
          <View style={{ 
            backgroundColor: "#fff", 
            padding: 20, 
            borderTopLeftRadius: 20, 
            borderTopRightRadius: 20,
            maxHeight: '70%'
          }}>
            <Text style={{ 
              fontWeight: "bold", 
              fontSize: 18, 
              marginBottom: 20,
              textAlign: 'center'
            }}>
              {i18n.t('filterOptionsTitle')}
            </Text>
            {/* Available Only Filter */}
            <TouchableOpacity
              style={{ 
                marginVertical: 10, 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 10
              }}
              onPress={() => setShowAvailableOnly(prev => !prev)}
            >
              <Ionicons 
                name={showAvailableOnly ? 'checkbox' : 'square-outline'} 
                size={22} 
                color="#e98c22" 
              />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                {i18n.t('filterAvailableOnly')}
              </Text>
            </TouchableOpacity>
            {/* Sort by Highest Price */}
            <TouchableOpacity
              style={{ 
                marginVertical: 10, 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 10
              }}
              onPress={() => {
                setSortByHighestPrice(prev => !prev);
                if (!sortByHighestPrice) setSortByLowestPrice(false);
              }}
            >
              <Ionicons 
                name={sortByHighestPrice ? 'checkbox' : 'square-outline'} 
                size={22} 
                color="#e98c22" 
              />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                {i18n.t('filterSortHighest')}
              </Text>
            </TouchableOpacity>
            {/* Sort by Lowest Price */}
            <TouchableOpacity
              style={{ 
                marginVertical: 10, 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 10
              }}
              onPress={() => {
                setSortByLowestPrice(prev => !prev);
                if (!sortByLowestPrice) setSortByHighestPrice(false);
              }}
            >
              <Ionicons 
                name={sortByLowestPrice ? 'checkbox' : 'square-outline'} 
                size={22} 
                color="#e98c22" 
              />
              <Text style={{ marginLeft: 10, fontSize: 16 }}>
                {i18n.t('filterSortLowest')}
              </Text>
            </TouchableOpacity>
            {/* Category Filter */}
            <View style={{ marginVertical: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
                تصفية حسب التصنيف:
              </Text>
              <ScrollView style={{ maxHeight: 120 }}>
                <TouchableOpacity
                  style={{ padding: 8, borderRadius: 6, backgroundColor: !filterCategory ? '#e98c22' : '#eee', marginBottom: 5 }}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text style={{ color: !filterCategory ? '#fff' : '#333' }}>كل التصنيفات</Text>
                </TouchableOpacity>
                {flatCategories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={{ padding: 8, borderRadius: 6, backgroundColor: filterCategory === cat._id ? '#e98c22' : '#eee', marginBottom: 5 }}
                    onPress={() => setFilterCategory(cat._id)}
                  >
                    <Text style={{ color: filterCategory === cat._id ? '#fff' : '#333' }}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Close Button */}
            <TouchableOpacity 
              onPress={() => setShowFilter(false)} 
              style={{
                backgroundColor: '#e98c22',
                padding: 15,
                borderRadius: 8,
                marginTop: 20
              }}
            >
              <Text style={{
                color: '#fff',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600'
              }}>
                تطبيق الفلترة
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Products List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e98c22" />
          <Text style={{ marginTop: 10, color: '#666' }}>جاري التحميل...</Text>
        </View>
      ) : (
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
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#e98c22"]}
              tintColor="#e98c22"
            />
          }
          ListEmptyComponent={ListEmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={6}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          getItemLayout={undefined} // Let FlatList calculate automatically
        />
      )}
    </View>
  );
};

export default SearchPage;