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
import i18n from "@/utils/i18n";

export default function Index() {
  const {
    getAllProducts,
    loadMoreAllProducts,
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
    getAllProducts();
  }, []);

  const onRefresh = useCallback(async () => {
    await getAllProducts();
    setIsTabBarVisible(true);
    handleSheetChanges(-1);
  }, [getAllProducts, setIsTabBarVisible, handleSheetChanges]);

  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }

  const onEndReachedHandler = useCallback(() => {
    if (!isProductsLoading && hasMore) {
      loadMoreAllProducts();
    }
  }, [loadMoreAllProducts, hasMore, isProductsLoading]);

  return (
    <GestureHandlerRootView style={styles.loadingContainer}>
      <BottomSheetModalProvider>
        <View style={{ backgroundColor: "#EFF6FFFF" }}>
          <FlatList
            onEndReachedThreshold={0.4}
            onEndReached={onEndReachedHandler}
            data={isProductsLoading && products.length === 0 ? Array.from({ length: 8 }) : products}
            renderItem={({ item, index }) => 
              isProductsLoading && products.length === 0 ? (
                <ItemCardSkeleton />
              ) : (
                <ItemCard
                  item={item}
                  handleSheetChanges={handleSheetChanges}
                  handlePresentModalPress={handlePresentModalPress}
                />
              )
            }
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl
                refreshing={isProductsLoading}
                onRefresh={onRefresh}
                progressViewOffset={10}
                progressBackgroundColor="#fff"
                colors={["#f0b745"]}
              />
            }
            ListFooterComponent={
              !hasMore ? (
                <Text style={{ textAlign: "center", marginVertical: 10, color: '#999', fontSize: 12 }}>
                  {i18n.t('noMoreProducts')}
                </Text>
              ) : null
            }
            keyExtractor={(item, index) => isProductsLoading && products.length === 0 ? index.toString() : item._id}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-around",
              alignItems: "center",
              width:"100%",
              backgroundColor:'#fff'
            }}
          />
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
    alignItems: "center",
    paddingBottom: 40,
  },
});
