import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  RefreshControl,
  BackHandler,
  Alert,
  Platform,
  I18nManager,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import ImageSlider from "../components/ImageSlide";
import { LinearGradient } from "expo-linear-gradient";
import ItemCard from "../components/Card";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "../components/BottomSheet";
import i18n from "@/utils/i18n";
import { useNavigationState } from "@react-navigation/native";
import axiosInstance from "@/utils/axiosInstans";
import { Ionicons } from "@expo/vector-icons";
const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.44;
const ITEM_HEIGHT = ITEM_WIDTH * 1.3;

export default function index() {
  const {
    getCategories,
    categories,
    products,
    getAllProducts,
    setIsTabBarVisible,
  } = useItemStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const navState = useNavigationState((state) => state);
  const [banners, setBanners] = useState([]);

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
    } finally {
      setRefreshing(false);
    }
  };

  const handleGetProducts = async () => {
    setRefreshing(true);
    try {
      await getAllProducts();
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setRefreshing(true);
      try {
        const [cat, prod, bannersRes] = await Promise.all([
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
    };
    fetchAll();
  }, []);

  const renderProductItem = ({ item }: any) => {
    return (
      <ItemCard
        item={item}
        handlePresentModalPress={handlePresentModalPress}
        handleSheetChanges={handleSheetChanges}
      />
    );
  };

  const renderCatigoryCircle = ({ item }: any) => {
    return (
      <View className="my-4">
        <View style={styles.categoryCircle}>
          <Image
            source={{ uri: item.image }}
            style={styles.categoryCircleImage}
            contentFit="cover"
            transition={400}
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          />
        </View>
      </View>
    );
  };
  const now = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(now.getDate() - 10);

  const renderCategoryItem = ({ item, index }: any) => {
    return (
      <Pressable
        style={[
          styles.categoryCard,
          {
            marginRight: index === 0 ? 20 : 8,
            marginLeft: index === categories.length - 1 ? 20 : 0,
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
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageOverlay}
            />

            {new Date(item.createdAt) > threeDaysAgo && (
              <View style={styles.categoryBadge}>
                <Text style={styles.badgeText}>{i18n.t("new")}</Text>
              </View>
            )}
          </View>

          <View style={styles.textContent}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.actionRow}>
              <Text style={styles.exploreText}>{i18n.t("exploreNow")}</Text>
              <View style={styles.arrowContainer}>
                {I18nManager.isRTL ? (
                  <Ionicons name="arrow-back" size={10} color="#000" />
                ) : (
                  <Ionicons name="arrow-forward" size={10} color="#000" />
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const SectionHeader = ({ title, onViewMore, showViewMore = true }: any) => (
    <View style={styles.sectionHeader}>
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {showViewMore && (
        <Pressable style={styles.viewMoreButton} onPress={onViewMore}>
          <Text style={styles.viewMoreText}>{i18n.t("viewAll")}</Text>
          <View style={styles.viewMoreIcon}>
            {I18nManager.isRTL ? (
              <Ionicons name="arrow-back" size={20} color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </View>
        </Pressable>
      )}
    </View>
  );

  return (
    <GestureHandlerRootView
      style={[
        styles.container,
        { direction: I18nManager.isRTL ? "rtl" : "ltr" },
      ]}
    >
      <BottomSheetModalProvider>
        <View style={styles.container}>
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
                    handleGetProducts(),
                  ]);
                }}
                colors={["#f0b745"]}
                tintColor="#f0b745"
              />
            }
          >
            <View style={styles.heroSection}>
              <ImageSlider
                banners={
                  banners.length
                    ? banners.slice(1, 2)
                    : [
                        {
                          _id: "placeholder",
                          image: "https://placehold.co/600x200?text=No+Banners",
                          title: "",
                          description: "",
                        },
                      ]
                }
              />
            </View>
            <View style={{ height: 10 }} />

            <View style={styles.categoriesSection}>
              <SectionHeader
                title={i18n.t("discoverOurCollection")}
                onViewMore={() => router.push(`/(screens)`)}
              />
              <FlatList
                data={categories?.slice(0, 20) || []}
                renderItem={renderCatigoryCircle}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `category-${item._id}`}
                contentContainerStyle={styles.horizontalList}
                snapToInterval={ITEM_WIDTH + 16}
                decelerationRate="fast"
                bounces={true}
              />

              <FlatList
                data={categories?.slice(0, 5) || []}
                renderItem={renderCategoryItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `category-${item._id}`}
                contentContainerStyle={styles.horizontalList}
                snapToInterval={ITEM_WIDTH + 16}
                decelerationRate="fast"
                bounces={true}
              />
            </View>

            <View style={styles.heroSection}>
              <ImageSlider
                banners={
                  banners.length
                    ? banners.slice(0, 1)
                    : [
                        {
                          _id: "placeholder",
                          image: "https://placehold.co/600x200?text=No+Banners",
                          title: "",
                          description: "",
                        },
                      ]
                }
              />
              <View style={{ height: 20 }} />
            </View>
            <View style={styles.latestProductsSection}>
              <SectionHeader
                title={i18n.t("latestProducts")}
                subtitle={i18n.t("latestAddedProducts")}
                onViewMore={() => router.push(`/(screens)`)}
              />
              <View style={styles.productsGrid}>
                <FlatList
                  data={products?.slice(0, 4) || []}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item._id}
                  numColumns={2}
                  columnWrapperStyle={styles.productsRow}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => (
                    <View style={styles.productsSeparator} />
                  )}
                />
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          snapPoints={["70%"]}
          index={0}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
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
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoryCircle: {
    width: 50,
    height: 50,
    borderRadius: 40,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCircleImage: {
    width: 50,
    height: 50,
    borderRadius: 40,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  // Hero Section
  heroSection: {
    height: height * 0.2,
    marginBottom: 6,
    marginHorizontal: 10,
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 16,
  },

  // Categories Section
  categoriesSection: {
    marginBottom: 10,
    paddingHorizontal: 6,
  },

  // Products Section
  latestProductsSection: {
    marginHorizontal: 8,
    marginBottom: 14,
  },
  productsGrid: {
    borderRadius: 20,
  },
  productsRow: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  productsSeparator: {
    height: 8,
  },

  // Section Headers
  sectionHeader: {
    backgroundColor: "#30a8a7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFFFF",
    textAlign: "left",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    justifyContent: "center",
    gap: 4,
    borderWidth: 0.5,
    borderRadius: 8,
    borderColor: "#FFFFFFFF",
    margin: 6,
    paddingHorizontal: 10,
  },
  viewMoreText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "400",
  },
  viewMoreIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreArrow: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  // Horizontal Lists
  horizontalList: {
    paddingRight: 4,
  },
  // Category Cards
  categoryCard: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
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
    height: 60,
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f0b745",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  textContent: {
    padding: 16,
    justifyContent: "space-between",
    minHeight: 80,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 22,
    textAlign: "left",
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exploreText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  arrowContainer: {
    width: 34,
    height: 14,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  // Bottom Sheet
  bottomSheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bottomSheetIndicator: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },

  // Spacing
  bottomSpacing: {
    height: 100,
  },
});
