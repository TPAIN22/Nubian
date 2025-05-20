import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const { products, isProductsLoading, getProducts, hasMore, setProduct } =
    useItemStore();
  const [scrolledDown, setScrolledDown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [border, setBorder] = useState("ffff");
  const statuss = headerTransparent ? "light" : "dark";
  const router = useRouter();
const scrollRef = useRef<ScrollView>(null);
  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > 100 && !scrolledDown) {
      setScrolledDown(true);
      setHeaderTransparent(false);
      setBorder("#000000FF");
    } else if (y <= 100 && scrolledDown) {
      setScrolledDown(false);
      setHeaderTransparent(true);
      setBorder("#ffff");
    }
  };

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => ({
        _id: `skeleton-${index}`,
        skeleton: true,
      })),
    []
  );
  useEffect(() => {
    const getProductss = async () => {
      await getProducts();
    };
    getProductss();
  }, []);

useEffect(() => {
  const scrollStep = 1;
  const itemWidth = 80; // عرض تقريبي لكل عنصر
  const totalWidth = categories.length * itemWidth;
  const screenWidth = Dimensions.get("window").width;

  let scrollValue = totalWidth - screenWidth; // نبدأ من أقصى اليمين

  const interval = setInterval(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: scrollValue, animated: false });
      scrollValue -= scrollStep;

      if (scrollValue <= 0) {
        scrollValue = totalWidth - screenWidth; // نرجع للبداية من أقصى اليمين
      }
    }
  }, 6);

  return () => clearInterval(interval);
}, []);



  const data = isProductsLoading ? skeletonItems : products;


  const handlePress = (item: Product) => {
    // Handle item press logic here
    setProduct(item);
    router.push(`/${item._id}`);
  };

  const categories = [
    "name",
    "price",
    "image",
    "images",
    "google",
    "microsoft",
    "nubian",
  ];

  return (
    <>
      <StatusBar style={statuss} />
      <Stack.Screen
        options={{
          headerTransparent: headerTransparent,
          headerStyle: {
            backgroundColor: headerTransparent ? "transparent" : "#fff",
          },
          headerShadowVisible: false,

          headerTitle: () => (
            <View
              style={[
                styles.searchContainer,
                {
                  borderColor: border,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={20}
                color="#000000FF"
                style={styles.icon}
              />
              <TextInput
                placeholder="ابحث..."
                placeholderTextColor="#000000"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: "#F3F3F3F7" }}>
        <FlatList
          data={data}
          style={{ width: "100%", flex: 1 }}
          renderItem={({ item }) =>
            isProductsLoading ? (
              <ItemCardSkeleton />
            ) : (
              <Pressable onPress={() => handlePress(item)}>
                <ItemCard item={item} />
              </Pressable>
            )
          }
          onScroll={handleScroll}
          scrollEventThrottle={20}
          onEndReached={() => {
            if (!isProductsLoading && hasMore) {
              getProducts();
            }
          }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.2}
          keyExtractor={(item) => item._id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{
            justifyContent: "center",
            borderRadius: 10,
            marginTop: 1,
            width: "100%",
            backgroundColor: "#F3F3F3F7",
          }}
          contentContainerStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
          ListHeaderComponent={() => (
             <>
    {/* 0 - السلايدر */}
    <View style={styles.sliderContainer}>
      <ImageSlider />
    </View>

    {/* 1 - التصنيفات (sticky) */}
    <View style={styles.categoriesContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScrollView}
      >
        {categories.map((category, index) => (
          <View key={index}>
            <Pressable style={styles.categoryItem}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={{ width: 50, height: 50 }}
              />
            </Pressable>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        ))}
      </ScrollView>
    </View>

    {/* 2 - عنوان القسم */}
    <View style={styles.sectionHeaderContainer}>
      <Pressable>
        <Text style={styles.viewAllText}>عرض الكل</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>أحدث المنتجات</Text>
    </View>
  </>
          )}

          ListFooterComponent={
            isProductsLoading ? (
              <View
                style={{
                  paddingVertical: 20,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#A37E2C" />
              </View>
            ) : !hasMore ? (
              <View
                style={{
                  paddingVertical: 20,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#888" }}>لا توجد منتجات إضافية</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={{
                paddingVertical: 20,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#888" }}>لا توجد منتجات</Text>
            </View>
          }
        />
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 36,
    minWidth: "100%",
    elevation: 0,
  },
  icon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  headerContainer: {
    width: "100%",
  },
  sliderContainer: {
    marginBottom: 6,
    overflow: "hidden",
  },
  selectedCategory: {
    backgroundColor: "#A37E2C",
  },
  pressedCategory: {
    opacity: 0.85,
  },
  sectionHeaderContainer: {
    backgroundColor: "#F8F8F8",
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  viewAllText: {
    fontSize: 18,
    color: "#A37E2C",
    fontWeight: "500",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  listContentContainer: {},
  footerContainer: {
    alignItems: "center",
  },
  noMoreProductsText: {
    color: "#888",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 12,
  },
  categoriesContainer: {
    maxHeight: 90,
     alignItems: "center",
    justifyContent: "center",
  },

  categoriesScrollView: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },

  categoryItem: {
    maxWidth: 60,
    borderRadius:60,
    borderWidth: 1,
    borderColor: "#A37E2C",
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryText: {
    fontSize: 12,
    color: "black",
    fontWeight: "300",
    textAlign: "center",
    alignSelf: "center",
  },
});
