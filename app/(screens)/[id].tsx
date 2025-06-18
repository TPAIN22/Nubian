import { useNetwork } from "@/providers/NetworkProvider";
import useItemStore from "@/store/useItemStore";
import { useCallback, useEffect, useRef } from "react";
import NoNetworkScreen from "../NoNetworkScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from "@gorhom/bottom-sheet";
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, StyleSheet, Text } from "react-native";
import { View } from "react-native";
import BottomSheet from "../components/BottomSheet";
import { useLocalSearchParams } from "expo-router";
import Card from "../components/Card";

export default function CategoriesScreen() {
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

  return (
    <GestureHandlerRootView style={styles.loadingContainer}>
      <BottomSheetModalProvider>
        <View style={{ backgroundColor: "#EFF6FFFF" }}>
          {isProductsLoading && products.length === 0 ? (
            <ActivityIndicator size="large" color="#e98c22" style={[{width:width} ,styles.loading ]} />
          ) : (
            <FlatList
              onEndReachedThreshold={0.6}
              onEndReached={onEndReachedHandler}
              data={products}
              renderItem={({ item }) => (
                <Card
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
                    لا توجد منتجات اضافية 
                   </Text>
                 ) : isProductsLoading ? (
                   <ActivityIndicator size="large" color="#e98c22" style={{width:width}} />
                 ) : null
               }
               ListEmptyComponent={
                 !isProductsLoading ? (
                    <View style={{ flex: 1 , width:width , alignItems:"center" , justifyContent:"center"}} >
                   <Text style={{ textAlign: "center", marginVertical: 10 , fontSize: 20 }}>
                     المعذرة
                     {'\n'} 
                      {'\n'}
                     لا يوجد منتجات في هذه الفئة  {'\n'} {'\n' }سنضيف المزيد من المنتجات قريبا...
                     
                   </Text>
                        </View>
                 ) : null
               }
               keyExtractor={(item) => item._id}
               numColumns={2}
               columnWrapperStyle={{ justifyContent: "space-around", alignItems: "center", gap: 10 }}
             />
          )}

        </View>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          index={0}>
          <BottomSheetView style={styles.contentContainer}>
            <BottomSheet />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({  
loading: { flex: 1 , justifyContent:'center', alignItems:'center' },
  loadingContainer: { alignItems:'center', justifyContent:'center', backgroundColor:'#fff', marginBottom: 80 },
  contentContainer: { flex: 1, padding: 10, alignItems:'center', paddingBottom:40 },
})
