import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import React, { useCallback, useEffect, useRef } from "react";
import ImageSlider from "../components/ImageSlide";
import useItemStore from "@/store/useItemStore";
import NoNetworkScreen from "../NoNetworkScreen";
import { useNetwork } from "@/providers/NetworkProvider";
import ItemCard from "../components/Card";
import ItemCardSkeleton from "../components/ItemCardSkeleton";
import { Stack } from "expo-router";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import BottomSheet from "../components/BottomSheet";

export default function Home() {
  const {
    getProducts,
    isProductsLoading,
    products,
    setIsTabBarVisible,
    product,
  } = useItemStore();
  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setIsTabBarVisible(true);
    }
  }, []);
  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }
  useEffect(() => {
    getProducts();
  }, []);
  const onRefresh = useCallback(async () => {
    await getProducts();
  }, []);
  return (
    <GestureHandlerRootView style={styles.loadingContainer}>
      <BottomSheetModalProvider>
        <View style={{ backgroundColor: "#EFF6FFFF" }}>
          {isProductsLoading ? (
            <FlatList
              data={Array.from({ length: 8 })}
              keyExtractor={(_, index) => index.toString()}
              renderItem={() => <ItemCardSkeleton />}
              numColumns={2}
            />
          ) : (
            <FlatList
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
              ListHeaderComponent={<ImageSlider />}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-around",
                alignItems: "center",
                marginHorizontal: "auto",
                gap: 10,
              }}
            />
          )}
        </View>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["75%"]}
          index={0}
        >
          <BottomSheetView style={styles.contentContainer}>
           <BottomSheet/>
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
    minHeight: "100%",
    backgroundColor: "#fff",
    paddingBottom: 140,
  },
  loginButton: {
    width: 200,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row",
    backgroundColor: "#e98c22",
    borderRadius: 35,
    marginTop: 10,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
});
