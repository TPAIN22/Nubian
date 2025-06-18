import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useRef } from "react";
import useItemStore from "@/store/useItemStore";
import NoNetworkScreen from "../NoNetworkScreen";
import { useNetwork } from "@/providers/NetworkProvider";
import ItemCard from "../components/Card";
import ItemCardSkeleton from "../components/ItemCardSkeleton";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import BottomSheet from "../components/BottomSheet";

export default function Index() {
  const {
    getProducts,
    isProductsLoading,
    products = [], 
    hasMore,
    setIsTabBarVisible,
  } = useItemStore();
  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

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

  useEffect(() => {
    if (products.length === 0)
    getProducts();
  }, []);

  const onRefresh = useCallback(async () => {
    await getProducts();
    setIsTabBarVisible(true);
    handleSheetChanges(-1);
  }, [getProducts, setIsTabBarVisible, handleSheetChanges]);

  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }

  const onEndReachedHandler = useCallback(() => {
    if (!isProductsLoading && hasMore) {
      getProducts();
    }
  }, [getProducts, hasMore, isProductsLoading]);

  return (
    <GestureHandlerRootView style={styles.loadingContainer}>
      <BottomSheetModalProvider>
        <View style={{ backgroundColor: "#EFF6FFFF" }}>
          {isProductsLoading && products.length === 0 ? (
            <FlatList
              data={Array.from({ length: 8 })}
              keyExtractor={(_, index) => index.toString()}
              renderItem={() => <ItemCardSkeleton />}
              numColumns={2}
              keyboardDismissMode="on-drag"
              refreshControl={
                <RefreshControl
                  refreshing={isProductsLoading}
                  onRefresh={onRefresh}
                  progressViewOffset={10}
                  progressBackgroundColor="#fff"
                  colors={["#e98c22"]}
                />
              }
            />
          ) : (
            <FlatList
              onEndReachedThreshold={0.6}
              onEndReached={onEndReachedHandler}
              data={products}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  handleSheetChanges={handleSheetChanges}
                  handlePresentModalPress={handlePresentModalPress}
                />
              )}
              keyboardDismissMode="on-drag"
              refreshControl={
                <RefreshControl
                  refreshing={isProductsLoading}
                  onRefresh={onRefresh}
                  progressViewOffset={10}
                  progressBackgroundColor="#fff"
                  colors={["#e98c22"]}
                />
              }
              ListFooterComponent={
                !hasMore ? (
                  <Text style={{ textAlign: "center", marginVertical: 10 }}>
                    No more products
                  </Text>
                ) : isProductsLoading ? (
                  <ActivityIndicator size="large" color="#e98c22" />
                ) : null
              }
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-around",
                alignItems: "center",
                gap: 10,
              }}
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginBottom: 80,
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    paddingBottom: 40,
  },
});
