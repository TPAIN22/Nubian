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
import { useRouter } from "expo-router";
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
const THREE_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const CIRCLE_SIZE = 80;

// Enhanced Category Circle with Navigation
const CategoryCircle = memo(({ item, index, onPress, colors }: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 50,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  const isNew = Date.now() - new Date(item.createdAt).getTime() < THREE_DAYS_MS;

  return (
    <Pressable
      onPress={() => onPress(item._id)}
      style={({ pressed }) => [
        styles.categoryCirclePressable,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <Animated.View
        style={[
          styles.categoryCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.categoryCircleWrapper, { borderColor: colors.primary }]}>
          <Image
            source={{ uri: item.image }}
            style={styles.categoryCircleImage}
            contentFit="cover"
            transition={300}
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          />
          <LinearGradient
            colors={[`${colors.primary}33`, `${colors.primary}00`]}
            style={styles.circleGlow}
          />
          {isNew && (
            <View style={[styles.circleNewBadge, { backgroundColor: colors.primary, borderColor: colors.text.white }]}>
              <Ionicons name="sparkles" size={12} color={colors.text.white} />
            </View>
          )}
        </View>
        <Text style={[styles.circleCategoryName, { color: colors.text.gray }]} numberOfLines={1}>
          {item.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const BannerItem = memo(({ item, index, colors }: any) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
  } = useItemStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [banners, setBanners] = useState([]);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { setScrollY } = useScrollStore();
  const { theme } = useTheme();
  const Colors = theme.colors;

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

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [, , bannersRes] = await Promise.all([
        getCategories(),
        getAllProducts(),
        axiosInstance.get("/banners"),
      ]);
      setBanners(bannersRes.data.filter((b: any) => b.isActive !== false));
    } catch (e) {
      setBanners([]);
    } finally {
      setRefreshing(false);
    }
  }, [getCategories, getAllProducts]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/(screens)/${categoryId}`);
  }, [router]);

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

  const renderCategoryCircle = useCallback(({ item, index }: any) => (
    <CategoryCircle item={item} index={index} onPress={handleCategoryPress} colors={Colors} />
  ), [handleCategoryPress, Colors]);

  const renderBanner = useCallback(({ item, index }: any) => (
    <BannerItem item={item} index={index} colors={Colors} />
  ), [Colors]);

  const keyExtractor = useCallback((item: any) => item._id, []);

  const memoizedCategories = useMemo(
    () => categories?.slice(0, 20),
    [categories]
  );

  const ListHeader = useCallback(
    () => (
      <View style={{ backgroundColor: Colors.surface }}>
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
              snapToInterval={width * 0.75 + 16}
              decelerationRate="fast"
              pagingEnabled={false}
            />
          </View>
        )}

        {/* Categories Section - Interactive Circles */}
        {memoizedCategories && memoizedCategories.length > 0 && (
          <View style={styles.categoriesSection}>
            <SectionHeader
              title={i18n.t("discoverOurCollection")}
              colors={Colors}
            />
            
            <FlatList
              data={memoizedCategories}
              renderItem={renderCategoryCircle}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.categoryCircleList}
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
      </View>
    ),
    [categories, banners, router, keyExtractor, memoizedCategories, renderCategoryCircle, renderBanner, Colors]
  );

  const getItemLayout = useCallback(
    (data: any, index: number) => {
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
          contentContainerStyle={{ backgroundColor: Colors.surface }}
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
    //marginTop: StatusBar.currentHeight || 20,
    marginBottom: 8,
  },
  categoryCirclePressable: {
    marginHorizontal: 8,
  },
  categoryCircle: {
    alignItems: "center",

  },
  categoryCircleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    borderWidth: 3,
    margin: 4,
    position: "relative",
  },
  categoryCircleImage: {
    width: "100%",
    height: "100%",
  },
  circleGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circleNewBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
  },
  circleCategoryName: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: CIRCLE_SIZE + 10,
  },
  categoryCircleList: {
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  horizontalListBanner: {
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContainer: {
    width: width ,
    height: 250,
    overflow: "hidden",
   
  },
  bannerImage: {
    width: "100%",
    height: "100%",
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
  categoriesSection: {
    paddingTop: 10,   
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
});

export default function Index() {
  return <IndexContent />;
}