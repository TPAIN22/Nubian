import React, { useCallback, useEffect, useMemo } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ScrollView,
} from "react-native";
import ItemCard from "../../components/ItemCard";
import ItemCardSkeleton from "../../components/ItemCardSkeleton";
import MasonryList from "@react-native-seoul/masonry-list";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, RelativePathString, router, Stack, useNavigation } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRef, useState } from "react";
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";
interface Product {
  _id: object;
  name: string;
  price: number;
  images: string[];
  image: string;
}

export default function Home() {
  const scrollY = useRef(0);
  const headerHeight = useHeaderHeight();
  const { setProduct, products, isProductsLoading, getProducts } = useItemStore();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  useEffect( () => {
    getProducts();
  }, []);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getProducts();
    setRefreshing(false);
  }, [getProducts]);

  const skeletonItems = useMemo(() => 
    Array.from({ length: 12 }).map((_, index) => ({
      _id: `skeleton-${index}`,
      skeleton: true,
    })), 
  []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 20 && scrollY.current <= 20) {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: "#FFFFFFFF",
          elevation: 0,
        },
      });
    } else if (offsetY <= 20 && scrollY.current > 20) {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
        },
      });
    }

    scrollY.current = offsetY;
  }, [navigation]);

  return (
    <>
      <Stack.Screen options={{ headerTransparent: true }}/>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#A37E2C"]} 
            tintColor="#A37E2C"
          />
        }
      >
        <MasonryList
          data={isProductsLoading ? skeletonItems : products}
          keyExtractor={(item: Product | { _id: string; skeleton: boolean }) => item._id.toString()}
          numColumns={2}
          style={{ marginBottom: 100 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 4,
            backgroundColor: "#FFFFF4A8",
            paddingTop: headerHeight,
          }}
          renderItem={({ item, i }: { item: unknown; i: number }) => {
            if (typeof item === 'object' && item !== null && 'skeleton' in item) return <ItemCardSkeleton />;
            const product = item as Product;
            return (
              <View>
                <Link
                  href={{
                    pathname: `/${product._id}` as RelativePathString,}}
                  asChild
                >
                  <Pressable onPress={() => setProduct(product)}>
                    <ItemCard item={product} />
                  </Pressable>
                </Link>

                <Pressable
                  onPress={() => {
                    setProduct(product);
                    router.navigate(`/${product._id}`);
                  }}
                  accessibilityLabel="Add to cart"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="cart-outline"
                    size={16}
                    color="black"
                    style={styles.cartIcon}
                  />
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            !isProductsLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={48} color="#A37E2C" />
                <Text style={styles.emptyText}>No products available</Text>
              </View>
            ) : null
          }
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  cartIcon: {
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 10,
    borderColor: "#A37E2C",
    borderWidth: 1,
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#A37E2C",
  }
});