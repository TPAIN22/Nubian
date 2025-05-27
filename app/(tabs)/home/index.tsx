import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";
import ItemCardSkeleton from "@/app/components/ItemCardSkeleton";
import ItemCard from "@/app/components/ItemCard";
import { useHeaderHeight } from "@react-navigation/elements";
import ImageSlider from "@/app/components/ImageSlide";
import { Stack, useRouter } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";

interface Product {
  _id: object;
  name: string;
  price: number;
  images: string[];
  image: string;
}

export default function Home() {
  const headerHeight = useHeaderHeight();
  const [headerTransparent, setHeaderTransparent] = useState(true);
  const { products, isProductsLoading, getProducts, hasMore, setProduct } = useItemStore();
  const [scrolledDown, setScrolledDown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [border, setBorder] = useState("#ffffff");
  const [refreshing, setRefreshing] = useState(false);
  
  const statuss = headerTransparent ? "light" : "dark";
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  // Categories data
  const categories = [
    { name: "إلكترونيات", icon: "phone-portrait-outline" },
    { name: "ملابس", icon: "shirt-outline" },
    { name: "منزل", icon: "home-outline" },
    { name: "رياضة", icon: "fitness-outline" },
    { name: "كتب", icon: "book-outline" },
    { name: "طعام", icon: "restaurant-outline" },
    { name: "سيارات", icon: "car-outline" },
  ];

  // Handle scroll for header transparency
  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > 100 && !scrolledDown) {
      setScrolledDown(true);
      setHeaderTransparent(false);
      setBorder("#E2E8F0");
    } else if (y <= 100 && scrolledDown) {
      setScrolledDown(false);
      setHeaderTransparent(true);
      setBorder("#ffffff");
    }
  }, [scrolledDown]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getProducts(true); // Pass true to reset pagination
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [getProducts]);

  // Skeleton items for loading
  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => ({
        _id: `skeleton-${index}`,
        skeleton: true,
      })),
    []
  );

  // Initial data fetch
  useEffect(() => {
    const getProductss = async () => {
      await getProducts();
    };
    getProductss();
  }, []);

  // Auto-scroll categories (optimized)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const startAutoScroll = () => {
      const scrollStep = 0.5;
      const itemWidth = 80;
      const totalWidth = categories.length * itemWidth;
      const screenWidth = Dimensions.get("window").width;
      let scrollValue = totalWidth - screenWidth;

      intervalId = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: scrollValue, animated: false });
          scrollValue -= scrollStep;

          if (scrollValue <= 0) {
            scrollValue = totalWidth - screenWidth;
          }
        }
      }, 20);
    };

    const timer = setTimeout(startAutoScroll, 1000);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [categories.length]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter((product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const data = isProductsLoading && products.length === 0 ? skeletonItems : filteredProducts;

  const handlePress = (item: Product) => {
    setProduct(item);
    router.push(`/${item._id}`);
  };

  const handleCategoryPress = (category: string) => {
    setSearchQuery(category);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.skeleton) {
      return <ItemCardSkeleton />;
    }
    
    return (
      <Pressable onPress={() => handlePress(item)} style={styles.itemPressable}>
        <ItemCard item={item} />
      </Pressable>
    );
  };

  const renderHeader = () => (
    <>
      {/* Image Slider */}
      <View style={styles.sliderContainer}>
        <ImageSlider />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollView}
        >
          {categories.map((category, index) => (
            <Pressable
              key={index}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category.name)}
            >
              <View style={styles.categoryIconContainer}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color="#A37E2C"
                />
              </View>
              <Text style={styles.categoryText}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderContainer}>
        <Pressable>
          <Text style={styles.viewAllText}>عرض الكل</Text>
        </Pressable>
        <Text style={styles.sectionTitle}>
          {searchQuery ? `نتائج البحث: ${searchQuery}` : "أحدث المنتجات"}
        </Text>
      </View>
    </>
  );

  const renderFooter = () => {
    if (isProductsLoading && products.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="large" color="#A37E2C" />
        </View>
      );
    }
    
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.noMoreProductsText}>لا توجد منتجات إضافية</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#CBD5E0" />
      <Text style={styles.emptyText}>
        {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات"}
      </Text>
      {searchQuery && (
        <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
          <Text style={styles.clearSearchText}>مسح البحث</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <>
      <StatusBar style={statuss} />
      <Stack.Screen
        options={{
          headerTransparent: headerTransparent,
          headerStyle: {
            backgroundColor: headerTransparent ? "transparent" : "#ffffff",
          },
          headerShadowVisible: !headerTransparent,
          headerTitle: () => (
            <View style={[styles.searchContainer, { borderColor: border }]}>
              <Ionicons
                name="search"
                size={20}
                color="#718096"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="ابحث عن المنتجات..."
                placeholderTextColor="#A0AEC0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#CBD5E0" />
                </Pressable>
              )}
            </View>
          ),
        }}
      />
      
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          initialNumToRender={8}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={async () => {
            if (!isProductsLoading && hasMore && !searchQuery) {
              await getProducts();
            }
          }}
          onEndReachedThreshold={0.2}
          keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContentContainer,
            data.length === 0 && { flex: 1 }
          ]}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#A37E2C"]}
              tintColor="#A37E2C"
              title="جاري التحديث..."
              titleColor="#A37E2C"
            />
          }
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="automatic"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 40,
    minWidth: "100%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
    padding: 0,
    color: "#2D3748",
  },
  sliderContainer: {
    marginBottom: 16,
    overflow: "hidden",
  },
  categoriesContainer: {
    maxHeight: 100,
    marginBottom: 16,
  },
  categoriesScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 60,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#A37E2C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 2,
    shadowColor: "#A37E2C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#4A5568",
    fontWeight: "500",
    textAlign: "center",
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
  },
  viewAllText: {
    fontSize: 14,
    color: "#A37E2C",
    fontWeight: "600",
  },
  columnWrapper: {
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  itemPressable: {
    flex: 0.5,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noMoreProductsText: {
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#718096",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#A37E2C",
    borderRadius: 20,
  },
  clearSearchText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});