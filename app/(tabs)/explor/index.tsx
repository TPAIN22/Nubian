import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import useItemStore from "@/store/useItemStore";
import { BlurView } from "expo-blur";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    marginTop: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    textAlign: "right",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    marginLeft: 5,
    color: "#A37E2C",
    fontWeight: "500",
  },
  listContainer: {
    padding: 5,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 14,
    color: "#006348",
    marginRight: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#A37E2C",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  noResults: {
    marginTop: 10,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});