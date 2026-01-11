import {
  View,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
  StatusBar,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useCallback, useEffect, useRef, useState, memo, useMemo } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import ItemCard from "../components/Card";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "../components/BottomSheet";
import i18n from "@/utils/i18n";
import axiosInstance from "@/utils/axiosInstans";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/locales/brandColors";
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";

const { width, height } = Dimensions.get("window");


const BannerItem = memo(({ item, index, colors }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.99)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.bannerImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={["transparent", colors.overlayDark]}
          style={styles.bannerOverlay}
        />
      </View>
    </Animated.View>
  );
});

const SectionHeader = memo(({ title, colors }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.titleContainer}>
      <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
      <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>{title}</Text>
    </View>
  </View>
));

function IndexContent() {
  const {
    getCategories,
    categories,
    products,
    getAllProducts,
    setIsTabBarVisible,
    error,
    isProductsLoading,
  } = useItemStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setScrollY } = useScrollStore();
  const { theme } = useTheme();
  const Colors = theme.colors;
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 3000; // Minimum 3 seconds between fetches

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) setIsTabBarVisible(true);
    },
    [setIsTabBarVisible]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const fetchData = useCallback(async (forceBanners = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }
    
    // Throttle: Don't fetch if last fetch was less than MIN_FETCH_INTERVAL ago
    // But always fetch banners if forceBanners is true
    if (!forceBanners && timeSinceLastFetch < MIN_FETCH_INTERVAL && lastFetchTimeRef.current > 0) {
      return;
    }
    
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setRefreshing(true);
    try {
      // Always fetch banners, but conditionally fetch categories/products
      const promises: Promise<any>[] = [axiosInstance.get("/banners")];
      
      // Only fetch categories/products if we don't have them
      if (categories.length === 0) {
        promises.unshift(getCategories());
      } else {
        promises.unshift(Promise.resolve(null));
      }
      
      if (products.length === 0) {
        promises.splice(1, 0, getAllProducts());
      } else {
        promises.splice(1, 0, Promise.resolve(null));
      }
      
      const [, , bannersRes] = await Promise.all(promises);
      // Extract banners from response - handle both direct array and wrapped response
      const bannersData = bannersRes?.data?.data || bannersRes?.data || [];
      setBanners(Array.isArray(bannersData) ? bannersData.filter((b: any) => b.isActive !== false) : []);
    } catch (e) {
      // If banners fetch fails, keep existing banners if any
      // Only clear banners if this was a forced fetch (screen focus)
      if (forceBanners) {
        // Keep existing banners on error to avoid flickering
      }
    } finally {
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [getCategories, getAllProducts, categories.length, products.length]);

  useEffect(() => {
    // Initial fetch on mount
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch banners when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Always refetch banners when screen is focused
      fetchData(true);
    }, [fetchData])
  );


  const renderProductItem = useCallback(
    ({ item }: any) => (
      <ItemCard
        item={item}
        handlePresentModalPress={handlePresentModalPress}
        handleSheetChanges={handleSheetChanges}
      />
    ),
    [handlePresentModalPress, handleSheetChanges]
  );

  const renderBanner = useCallback(({ item, index }: any) => (
    <BannerItem item={item} index={index} colors={Colors} />
  ), [Colors]);

  const keyExtractor = useCallback((item: any) => item._id, []);

  const ListHeader = useCallback(
    () => (
      <View style={[styles.listHeaderContainer, { backgroundColor: Colors.surface }]}>
        {/* Top Gradient Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.gold, "transparent"]}
          style={styles.topGradient}
        />

        {/* Featured Banners */}
        {banners.length > 0 && (
          <View style={styles.bannersSection}>
            <FlatList
              data={banners}
              renderItem={renderBanner}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.horizontalListBanner}
              snapToInterval={width}
              decelerationRate="fast"
              pagingEnabled={true}
              style={styles.bannerFlatList}
            />
          </View>
        )}


        {/* Latest Products Header */}
        <View style={styles.latestProductsSection}>
          <SectionHeader
            title={i18n.t("latestProducts")}
            colors={Colors}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Empty State */}
        {!isProductsLoading && products.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={Colors.text.veryLightGray} />
            <Text style={[styles.emptyText, { color: Colors.text.veryLightGray }]}>
              {i18n.t("noProductsAvailable") || "لا توجد منتجات متاحة"}
            </Text>
          </View>
        )}
      </View>
    ),
    [banners, router, keyExtractor, renderBanner, Colors, error, products.length, isProductsLoading]
  );

  const getItemLayout = useCallback(
    (_data: any, index: number) => {
      const itemHeight = width * 0.45 * 1.3 + 16;
      return {
        length: itemHeight,
        offset: itemHeight * Math.floor(index / 2),
        index,
      };
    },
    []
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors.surface }]}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <BottomSheetModalProvider>
        <Animated.FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.productsRow}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={7}
          initialNumToRender={6}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
          scrollEventThrottle={16}
          style={{ backgroundColor: Colors.surface }}
          contentContainerStyle={{ backgroundColor: Colors.surface, paddingHorizontal: 0 }}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            setScrollY(offsetY);
            // Also update animated value
            scrollY.setValue(offsetY);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchData}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              progressBackgroundColor={Colors.cardBackground}
            />
          }
        />

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: Colors.cardBackground }]}
          handleIndicatorStyle={[styles.bottomSheetIndicator, { backgroundColor: Colors.gray[300] }]}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
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
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  listHeaderContainer: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
    width: '100%',
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.15,
    zIndex: -1,
  },
  bannersSection: {
    width: width + 32,
    marginLeft: -16,
    marginRight: -16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  bannerFlatList: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
    flexGrow: 0,
  },
  horizontalListBanner: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  bannerContainer: {
    width: width,
    height: 250,
    overflow: "hidden",
    alignSelf: 'stretch',
  },
  bannerImage: {
    width: width,
    height: "100%",
    flex: 1,
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  heroSection: {
    height: height * 0.22,
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 20,
  },
  latestProductsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  productsRow: {
    justifyContent: "center",
    gap: width * 0.04,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  separator: {
    height: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accentBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  bottomSheetBackground: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  bottomSheetIndicator: {
    width: 48,
    height: 5,
    borderRadius: 3,
  },
  errorContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});

export default function Index() {
  return <IndexContent />;
}