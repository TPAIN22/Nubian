import { useNetwork } from "@/providers/NetworkProvider";
import useItemStore from "@/store/useItemStore";
import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import NoNetworkScreen from "../NoNetworkScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import BottomSheet from "../components/BottomSheet";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import Card from "../components/Card";
import { useTheme } from "@/providers/ThemeProvider";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import i18n from "@/utils/i18n";
import axiosInstance from "@/utils/axiosInstans";

const HEADER_HEIGHT = 200;

interface Category {
  _id: string;
  name: string;
  image?: string;
  description?: string;
  isActive?: boolean;
}

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // Handle array params (expo-router can return arrays)
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // Validate ID format - must be MongoDB ObjectId (24 hex characters)
  const isValidCategoryId = id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  
  // Guard: If no valid ID, redirect immediately (before any rendering)
  if (!isValidCategoryId) {
    return <Redirect href="/(tabs)" />;
  }
  const insets = useSafeAreaInsets();

  const {
    selectCategoryAndLoadProducts,
    getProducts,
    isProductsLoading,
    products = [],
    hasMore,
    setIsTabBarVisible,
    selectedCategory,
    categories,
    getCategories,
  } = useItemStore();

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Approximate row height based on card image (200) + text/padding (~100)
  const ROW_HEIGHT = 300;
  const HEADER_COLLAPSED_HEIGHT = 100;
  const SCROLL_THRESHOLD = 100; // Delay before header starts collapsing

  // Header animations - collapses when scrolling
  const headerHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 100],
    outputRange: [HEADER_HEIGHT, HEADER_COLLAPSED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });

  const headerImageOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 50],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const headerImageTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD, SCROLL_THRESHOLD + 50],
    outputRange: [0, -20, -80],
    extrapolate: "clamp",
  });

  const categoryInfoOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD - 20, SCROLL_THRESHOLD + 20],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [SCROLL_THRESHOLD - 30, SCROLL_THRESHOLD + 20, SCROLL_THRESHOLD + 50],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  });

  const compactHeaderTranslateY = scrollY.interpolate({
    inputRange: [SCROLL_THRESHOLD - 30, SCROLL_THRESHOLD + 20],
    outputRange: [10, 0],
    extrapolate: "clamp",
  });

  // Fetch category details - only if ID is valid MongoDB ObjectId
  useEffect(() => {
    // Validate ID format before fetching
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return;
    }

    const fetchCategoryDetails = async () => {
      try {
        // First try to get from store categories
        const categoryFromStore = categories.find((cat: Category) => cat._id === id);
        
        if (categoryFromStore) {
          setCategoryData(categoryFromStore);
        } else {
          // Fetch from API
          const response = await axiosInstance.get(`/categories/${id}`);
          const category = response.data?.data || response.data;
          if (category) {
            setCategoryData(category);
          }
        }
      } catch (error) {
        console.error("Error fetching category details:", error);
        // Try to get from store categories as fallback
        const categoryFromStore = categories.find((cat: Category) => cat._id === id);
        if (categoryFromStore) {
          setCategoryData(categoryFromStore);
        }
      }
    };

    fetchCategoryDetails();
    
    // Also ensure categories are loaded
    if (categories.length === 0) {
      getCategories();
    }
  }, [id, categories]);


  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsTabBarVisible(true);
      }
    },
    [setIsTabBarVisible]
  );

  // Load products when category changes - only if ID is valid
  useEffect(() => {
    // Validate ID format before loading products
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return;
    }

    if (selectedCategory !== id) {
      if (__DEV__) {
        console.log('[CategoryScreen] Loading products for category:', {
          categoryId: id,
          previousCategory: selectedCategory,
        });
      }
      selectCategoryAndLoadProducts(id);
    }
  }, [id, selectedCategory, selectCategoryAndLoadProducts]);

  const onRefresh = useCallback(async () => {
    if (id) {
      await selectCategoryAndLoadProducts(id);
    }
    setIsTabBarVisible(true);
    handleSheetChanges(-1);
  }, [id, selectCategoryAndLoadProducts, setIsTabBarVisible, handleSheetChanges]);

  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }

  const onEndReachedHandler = useCallback(() => {
    if (!isProductsLoading && hasMore && selectedCategory) {
      getProducts();
    }
  }, [getProducts, hasMore, isProductsLoading, selectedCategory]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <Card
        item={item}
        handleSheetChanges={handleSheetChanges}
        handlePresentModalPress={handlePresentModalPress}
      />
    ),
    [handleSheetChanges, handlePresentModalPress]
  );

  const columnWrapper = useMemo(
    () => ({
      justifyContent: "space-around" as const,
      alignItems: "center" as const,
      paddingHorizontal: 12,
      gap: 12,
    }),
    []
  );

  const keyExtractor = useCallback((item: any) => item._id, []);

  const categoryName = categoryData?.name || i18n.t("category") || "Category";
  const categoryDescription = categoryData?.description || "";
  const categoryImage = categoryData?.image;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors.surface }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      <BottomSheetModalProvider>
        {/* Collapsible Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top,
              height: headerHeight,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Full Header with Image - Fades out when scrolling */}
          <Animated.View
            style={[
              styles.fullHeader,
              {
                opacity: headerImageOpacity,
                transform: [{ translateY: headerImageTranslateY }],
              },
            ]}
          >
            {/* Back Button */}
            <View style={[styles.backButton, { top: insets.top + 10 }]}>
              <Pressable onPress={() => router.back()}>
                <View style={[styles.backButtonInner, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            {/* Background Image with Gradient */}
            {categoryImage ? (
              <View style={styles.headerBackground}>
                <Image
                  source={{ uri: categoryImage }}
                  style={styles.headerImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)", "transparent"]}
                  style={styles.headerGradient}
                />
              </View>
            ) : (
              <View style={styles.headerBackground}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
                  style={styles.headerBackground}
                />
              </View>
            )}

            {/* Category Info */}
            <Animated.View 
              style={[
                styles.categoryInfo,
                {
                  opacity: categoryInfoOpacity,
                }
              ]}
            >
              <Text style={[styles.categoryName, { color: Colors.text.white }]} numberOfLines={2}>
                {categoryName}
              </Text>
              {categoryDescription && (
                <Text
                  style={[styles.categoryDescription, { color: Colors.text.white }]}
                  numberOfLines={2}
                >
                  {categoryDescription}
                </Text>
              )}
            </Animated.View>
          </Animated.View>

          {/* Compact Header - Appears when scrolling (name, description, back button only) */}
          <Animated.View
            style={[
              styles.compactHeader,
              {
                opacity: compactHeaderOpacity,
                transform: [{ translateY: compactHeaderTranslateY }],
                backgroundColor: Colors.surface,
                borderBottomColor: Colors.borderLight,
                paddingTop: insets.top,
              },
            ]}
          >
            <View style={styles.compactHeaderContent}>
              <Pressable onPress={() => router.back()} style={styles.compactBackButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.gray} />
              </Pressable>
              <View style={styles.compactHeaderText}>
                <Text style={[styles.compactCategoryName, { color: Colors.text.gray }]} numberOfLines={1}>
                  {categoryName}
                </Text>
                {categoryDescription && (
                  <Text
                    style={[styles.compactCategoryDescription, { color: Colors.text.veryLightGray }]}
                    numberOfLines={1}
                  >
                    {categoryDescription}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Products List */}
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: HEADER_HEIGHT + 20, // Space for initial header
              paddingBottom: 100,
            },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReachedThreshold={0.6}
          onEndReached={onEndReachedHandler}
          keyboardDismissMode="on-drag"
          removeClippedSubviews={true}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={9}
          updateCellsBatchingPeriod={50}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => {
            const row = Math.floor(index / 2);
            return {
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * row,
              index,
            };
          }}
          refreshControl={
            <RefreshControl
              refreshing={isProductsLoading && products.length === 0}
              onRefresh={onRefresh}
              progressViewOffset={HEADER_HEIGHT + 20}
              progressBackgroundColor={Colors.cardBackground}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListFooterComponent={
            !hasMore && products.length > 0 ? (
              <View style={styles.footerContainer}>
                <View style={[styles.footerLine, { backgroundColor: Colors.borderLight }]} />
                <Text style={[styles.footerText, { color: Colors.text.veryLightGray }]}>
                  {i18n.t("allProductsShown") || "All products shown"}
                </Text>
                <View style={[styles.footerLine, { backgroundColor: Colors.borderLight }]} />
              </View>
            ) : isProductsLoading && products.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.loadingText, { color: Colors.text.veryLightGray, marginLeft: 8 }]}>
                  {i18n.t("loading") || "Loading..."}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isProductsLoading ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: Colors.cardBackground }]}>
                  <Ionicons
                    name="grid-outline"
                    size={64}
                    color={Colors.text.veryLightGray}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: Colors.text.gray }]}>
                  {i18n.t("noProducts") || "No Products"}
                </Text>
                <Text style={[styles.emptySubtitle, { color: Colors.text.veryLightGray }]}>
                  {i18n.t("noProductsFound") || "No products found in this category"}
                </Text>
                {__DEV__ && (
                  <Text style={[styles.debugText, { color: Colors.text.veryLightGray }]}>
                    Category ID: {id || "N/A"}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.loadingText, { color: Colors.text.veryLightGray, marginTop: 16 }]}>
                  {i18n.t("loading") || "Loading products..."}
                </Text>
              </View>
            )
          }
        />

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          index={0}
        >
          <BottomSheetView style={styles.contentContainer}>
            <BottomSheet />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  fullHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderBottomWidth: 1,
    justifyContent: "center",
  },
  compactHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  compactBackButton: {
    marginRight: 12,
    padding: 4,
  },
  compactHeaderText: {
    flex: 1,
  },
  compactCategoryName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  compactCategoryDescription: {
    fontSize: 12,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    top: 0,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryInfo: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  categoryName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryDescription: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  productCountBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 10,
    marginTop: 8,
    textAlign: "center",
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    paddingHorizontal: 20,
  },
  footerLine: {
    flex: 1,
    height: 1,
  },
  footerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: "500",
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    minHeight: 400,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerLoader: {
    paddingVertical: 12,
    alignItems: "center",
  },
});
