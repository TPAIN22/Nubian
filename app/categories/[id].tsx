import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import useCategoryStore from "@/store/useCategoryStore";
import { useTheme } from "@/providers/ThemeProvider";
import { useNetwork } from "@/providers/NetworkProvider";
import NoNetworkScreen from "../NoNetworkScreen";
import ProductCard from "@/components/ProductCard";
import i18n from "@/utils/i18n";
import useItemStore from "@/store/useItemStore";
import { navigateToProduct } from "@/utils/deepLinks";

const ROW_HEIGHT = 300;

export default function CategoryScreen() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isConnected, isNetworkChecking, retryNetworkCheck } = useNetwork();
  
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isValidCategoryId = id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

  const {
    selectedCategory,
    categoryProducts,
    productsLoading,
    productsLoadingMore,
    productsError,
    hasMoreProducts,
    fetchCategoryById,
    fetchProductsByCategory,
    loadMoreProducts,
    clearCategoryState,
  } = useCategoryStore();

  const setProduct = useItemStore((state: any) => state.setProduct);

  useEffect(() => {
    if (!isValidCategoryId || !id) return;
    
    // Clear old state before fetching new
    clearCategoryState();
    
    fetchCategoryById(id);
    fetchProductsByCategory(id, 1);
    
  }, [id, isValidCategoryId, clearCategoryState, fetchCategoryById, fetchProductsByCategory]);

  const handleRefresh = useCallback(() => {
    if (isValidCategoryId) {
      fetchProductsByCategory(id, 1);
    }
  }, [id, fetchProductsByCategory]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ProductCard 
      item={item} 
      onPress={() => {
        setProduct(item);
        navigateToProduct(item.id || item._id, item);
      }}
      showWishlist={true} 
    />
  ), [setProduct]);

  if (!isValidCategoryId) {
    return <Redirect href="../" />;
  }
  
  if (!isConnected && !isNetworkChecking) {
    return <NoNetworkScreen onRetry={retryNetworkCheck} />;
  }

  const categoryName = selectedCategory?.name || i18n.t("category") || "Category";
  const categoryDescription = selectedCategory?.description || "";
  const categoryImage = selectedCategory?.image;

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerBackground}>
          {categoryImage ? (
            <>
              <Image source={{ uri: categoryImage }} style={styles.headerImage} contentFit="cover" />
              <LinearGradient
                colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.7)"]}
                style={styles.headerGradient}
              />
            </>
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark || Colors.primary]}
              style={styles.headerGradient}
            />
          )}
        </View>

        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </View>
        </Pressable>

        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={1}>{categoryName}</Text>
          {categoryDescription ? (
            <Text style={styles.categoryDescription} numberOfLines={2}>{categoryDescription}</Text>
          ) : null}
        </View>
      </View>

      {/* States */}
      {productsLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : productsError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.danger || Colors.primary} />
          <Text style={[styles.errorTitle, { color: Colors.text.gray }]}>{i18n.t("error") || "Error"}</Text>
          <Text style={[styles.errorSubtitle, { color: Colors.text.mediumGray }]}>{productsError}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: Colors.primary }]} onPress={handleRefresh}>
            <Text style={styles.retryText}>{i18n.t("retry") || "Retry"}</Text>
          </Pressable>
        </View>
      ) : categoryProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="grid-outline" size={64} color={Colors.text.veryLightGray} />
          <Text style={[styles.emptyTitle, { color: Colors.text.gray }]}>{i18n.t("noProducts") || "No Products"}</Text>
          <Text style={[styles.emptySubtitle, { color: Colors.text.mediumGray }]}>
            {i18n.t("noProductsFound") || "No products found in this category."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={categoryProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          getItemLayout={(_data, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * Math.floor(index / 2),
            index,
          })}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {productsLoadingMore ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : !hasMoreProducts ? (
                <Text style={[styles.footerText, { color: Colors.text.mediumGray }]}>
                  {i18n.t("allProductsShown") || "All products shown"}
                </Text>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: 160,
    width: "100%",
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 30, // Fallback safearea if insets empty
    left: 16,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: {
    marginTop: "auto",
  },
  categoryName: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categoryDescription: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
  },
});
