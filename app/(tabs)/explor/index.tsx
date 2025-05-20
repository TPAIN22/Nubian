import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import useItemStore from "@/store/useItemStore";
import styles from "./styles";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
}

const DEFAULT_IMAGE = "https://placehold.jp/3d4070/ffffff/150x150.png";
const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;

const SearchPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { products, getProducts, setProduct } = useItemStore();

  const handleLoadMore = async () => {
    try {
      if(refreshing || isLoading) return;
      await getProducts();
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getProducts();
    } catch (error) {
      console.error("Error refreshing products:", error);
    } finally {
      setRefreshing(false);
    }
  }, [getProducts]);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        await getProducts();
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [getProducts]);

  const filteredProducts = useMemo(() => 
    products?.filter((product: Product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [],
    [products, searchTerm]
  );

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.8}
      onPress={() => {
        setProduct(item);
        router.push(`/${item._id}`);
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
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.cardBottom}>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>SDG</Text>
            <Text style={styles.price}>{item.price}</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [router]);

  const keyExtractor = useCallback((item: Product) => item._id, []);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={50} color="#999" />
      <Text style={styles.noResults}>
        {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد منتجات متاحة"}
      </Text>
    </View>
  ), [searchTerm]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="ابحث عن منتج..."
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

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={18} color="#A37E2C" />
          <Text style={styles.filterText}>تصفية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="swap-vertical" size={18} color="#A37E2C" />
          <Text style={styles.filterText}>ترتيب</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A37E2C" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#A37E2C"]}
              tintColor="#A37E2C"
            />
          }
          ListEmptyComponent={ListEmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default SearchPage;

