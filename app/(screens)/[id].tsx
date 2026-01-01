import { useNetwork } from "@/providers/NetworkProvider";
import useItemStore from "@/store/useItemStore";
import { useCallback, useEffect, useRef, useMemo } from "react";
import NoNetworkScreen from "../NoNetworkScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { View } from "react-native";
import BottomSheet from "../components/BottomSheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import Card from "../components/Card";
import { useTheme } from "@/providers/ThemeProvider";

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { id } = useLocalSearchParams();

  const {
    selectCategoryAndLoadProducts,
    getProducts,
    isProductsLoading,
    products = [],
    hasMore,
    setIsTabBarVisible,
    selectedCategory,
  } = useItemStore();

  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { width, height } = Dimensions.get("window");
  // Approximate row height based on card image (210) + text/padding (~80)
  const ROW_HEIGHT = 300;

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
  const router = useRouter();

  // يتم التحميل مرة واحدة عند تغيير الفئة
  useEffect(() => {
    if (id && selectedCategory !== id) {
      selectCategoryAndLoadProducts(id);
    }
  }, [id, selectedCategory]);

  const onRefresh = useCallback(async () => {
    if (id) {
      await selectCategoryAndLoadProducts(id);
    }
    setIsTabBarVisible(true);
    handleSheetChanges(-1);
  }, [id]);

  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }

  const onEndReachedHandler = useCallback(() => {
    if (!isProductsLoading && hasMore && selectedCategory) {
      getProducts();
    }
  }, [getProducts, hasMore, isProductsLoading, selectedCategory]);

  const renderItem = useCallback(({ item }: any) => (
    <Card
      item={item}
      handleSheetChanges={handleSheetChanges}
      handlePresentModalPress={handlePresentModalPress}
    />
  ), [handleSheetChanges, handlePresentModalPress]);

  const columnWrapper = useMemo(
    () => ({
      justifyContent: 'space-around',
      alignItems: 'center',
      // gap is not well-typed across RN versions; spacing handled by card widths
    } as const),
    []
  );

  const keyExtractor = useCallback((item: any) => item._id, []);

  return (
    <GestureHandlerRootView style={[styles.loadingContainer, { backgroundColor: Colors.surface }]}>
      <BottomSheetModalProvider>
        <View style={{ backgroundColor: Colors.surface }}>
          {isProductsLoading && products.length === 0 ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={[{ width: width }, styles.loading]}
            />
          ) : (
            <FlatList
              onEndReachedThreshold={0.6}
              onEndReached={onEndReachedHandler}
              data={products}
              renderItem={renderItem}
              keyboardDismissMode="on-drag"
              removeClippedSubviews={true}
              initialNumToRender={6}
              maxToRenderPerBatch={10}
              windowSize={9}
              updateCellsBatchingPeriod={50}
              decelerationRate="fast"
              keyExtractor={keyExtractor}
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
                  refreshing={isProductsLoading}
                  onRefresh={onRefresh}
                  progressViewOffset={10}
                  progressBackgroundColor={Colors.cardBackground}
                  colors={[Colors.primary]}
                />
              }
              ListFooterComponent={
                !hasMore ? (
                  <Text style={[styles.footerText, { color: Colors.text.veryLightGray }]}>
                    لا توجد منتجات اضافية
                  </Text>
                ) : isProductsLoading ? (
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                    style={styles.footerLoader}
                  />
                ) : null
              }
              ListEmptyComponent={
                !isProductsLoading ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: Colors.text.gray }]}>
                      المعذرة
                      {"\n"}
                      {"\n"}
                      لا يوجد منتجات في هذه الفئة {"\n"} {"\n"}سنضيف المزيد من
                      المنتجات قريبا...
                    </Text>
                  </View>
                ) : null
              }
              numColumns={2}
              columnWrapperStyle={columnWrapper}
            />
          )}
        </View>

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
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 20,
  },
  footerText: {
    textAlign: 'center',
    paddingVertical: 10,
  },
  footerLoader: {
    width: '100%'
  }
});
