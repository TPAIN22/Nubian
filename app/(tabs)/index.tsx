import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import ImageSlider from "../components/ImageSlide";
import { LinearGradient } from "expo-linear-gradient";
import ItemCard from "../components/Card";
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "../components/BottomSheet";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.46;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;

export default function index() {
  const { getCategories, categories, products, getAllProducts , setIsTabBarVisible} = useItemStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
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

  const handleGetCategories = async () => {
    setRefreshing(true);
    try {
      await getCategories();
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGetProducts = async () => {
    setRefreshing(true);
    try {
      // Call a new function to get all products without category filter
      await getAllProducts();
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        handleGetCategories(),
        handleGetProducts()
      ]);
    };
    loadInitialData();
  }, []);

  const renderProductItem = ({ item }: any) => {
    return <ItemCard item={item} handlePresentModalPress={handlePresentModalPress} handleSheetChanges={handleSheetChanges} />;
  };

  const renderCategoryItem = ({ item, index }: any) => {
    return (
      <Pressable
        style={[
          styles.categoryCard,
          {
            marginRight: index === 0 ? 16 : 6,
            marginLeft: index === categories.length - 1 ? 16 : 0,
          },
        ]}
        onPress={() => router.push(`/(screens)/${item._id}`)}
      >
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.categoryImage}
              contentFit="cover"
              transition={400}
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.imageOverlay}
            />
            <View style={styles.categoryBadge}>
              <Text style={styles.badgeText}>جديد</Text>
            </View>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.actionRow}>
              <Text style={styles.exploreText}>استكشف الآن</Text>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowIcon}>←</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const SectionHeader = ({
    title,
    subtitle,
    onViewMore,
    showViewMore = true,
  }: any) => (
    <View style={styles.sectionHeader}>
      {showViewMore && (
        <Pressable style={styles.viewMoreButton} onPress={onViewMore}>
          <View style={styles.viewMoreIcon}>
            <Text style={styles.arrowIcon}>←</Text>
          </View>
          <Text style={styles.viewMoreText}>عرض الكل</Text>
        </Pressable>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ProductSection = ({ title, subtitle, data, sectionKey }: any) => (
    <View style={styles.productSection}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        onViewMore={() => router.push(`/(screens)`)}
      />
      <FlatList
        data={data}
        renderItem={renderCategoryItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${sectionKey}-${item._id}`}
        contentContainerStyle={styles.horizontalList}
        snapToInterval={ITEM_WIDTH + 12}
        decelerationRate="fast"
        bounces={true}
      />
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              await Promise.all([
                handleGetCategories(),
                handleGetProducts()
              ]);
            }}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageSlider />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>مرحباً بك</Text>
          <Text style={styles.welcomeSubtitle}>
            اكتشف أفضل المنتجات المختارة خصيصاً لك
          </Text>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <SectionHeader
            title="فئات المنتجات"
            showViewMore={false}
          />
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `category-${item._id}`}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={ITEM_WIDTH + 12}
            decelerationRate="fast"
            bounces={true}
            inverted
          />
        </View>

        {/* Latest Products Section */}
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>المنتجات الأحدث</Text>
          <FlatList
            data={products?.slice(0, 4) || []}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-around",
              alignItems: "center",
              gap: 10,
            }}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  heroSection: {
    marginBottom: 20,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    elevation: 0,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "right",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "right",
    lineHeight: 22,
  },
  categoriesSection: {
    marginBottom: 18,
  },
  productSection: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
    textAlign: "right",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  viewMoreText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "500",
    marginRight: 4,
  },
  viewMoreIcon: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreArrow: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "bold",
    transform: [{ rotate: "180deg" }],
  },
  horizontalList: {
    paddingRight: 4,
    marginTop: 20,
  },
  categoryCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginHorizontal: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 0,
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f8f9fa",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(233, 140, 34, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  textContent: {
    padding: 12,
    justifyContent: "space-between",
    minHeight: 70,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: 20,
    textAlign: "right",
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exploreText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  arrowContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowIcon: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 80,
  },
});