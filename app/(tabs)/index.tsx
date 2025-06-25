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
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "../components/BottomSheet";
import i18n from "@/utils/i18n";
import { useNavigationState } from '@react-navigation/native';
import axiosInstance from "@/utils/axiosInstans";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.44;
const ITEM_HEIGHT = ITEM_WIDTH * 1.3;

export default function index() {
  const { getCategories, categories, products, getAllProducts, setIsTabBarVisible } = useItemStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const navState = useNavigationState(state => state);
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
    const loadInitialData = async () => {
      await Promise.all([
        handleGetCategories(),
        handleGetProducts()
      ]);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await axiosInstance.get('/banners');
        setBanners(res.data.filter((b: any) => b.isActive !== false));
      } catch (e) {
        setBanners([]);
      }
    };
    fetchBanners();
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
            <View style={styles.categoryBadge}>
              <Text style={styles.badgeText}>{i18n.t('new')}</Text>
            </View>
          </View>

          <View style={styles.textContent}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.actionRow}>
              <Text style={styles.exploreText}>{i18n.t('exploreNow')}</Text>
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
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {showViewMore && (
        <Pressable style={styles.viewMoreButton} onPress={onViewMore}>
          <Text style={styles.viewMoreText}>{i18n.t('viewAll')}</Text>
          <View style={styles.viewMoreIcon}>
            <Text style={styles.viewMoreArrow}>←</Text>
          </View>
        </Pressable>
      )}
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
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
                    handleGetProducts()
                  ]);
                }}
                colors={["#e98c22"]}
                tintColor="#e98c22"
              />
            }
          >
            <View style={styles.heroSection}>
              <ImageSlider banners={banners.length ? banners : [
                { _id: 'placeholder', image: 'https://placehold.co/600x200?text=No+Banners', title: '', description: '' }
              ]} />
            </View>

            <View style={styles.welcomeSection}>
              <LinearGradient
                colors={["#e98c22", "#f4a261"]}
                style={styles.welcomeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.welcomeContent}>
                  <Text style={styles.welcomeTitle}>{i18n.t('welcome')}</Text>
                  <Text style={styles.welcomeSubtitle}>
                    {i18n.t('welcomeSubtitle')}
                  </Text>
                </View>
                <View style={styles.welcomeDecoration}>
                  <View style={styles.decorationCircle} />
                  <View style={[styles.decorationCircle, styles.decorationCircle2]} />
                </View>
              </LinearGradient>
            </View>

            <View style={styles.categoriesSection}>
              <SectionHeader
                title={i18n.t('productCategories')}
                subtitle="اكتشف مجموعتنا المتنوعة"
                showViewMore={false}
              />
              <FlatList
                data={categories}
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

            <View style={styles.latestProductsSection}>
              <SectionHeader
                title={i18n.t('latestProducts')}
                subtitle="أحدث المنتجات المضافة"
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
                  ItemSeparatorComponent={() => <View style={styles.productsSeparator} />}
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
    backgroundColor: "#F8F9FA",
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
  
  // Hero Section
  heroSection: {
    height: height * 0.238,
    marginBottom: 14,
    marginHorizontal: 10,
    marginTop: 12,
    overflow: "hidden",
  },
  
  // Welcome Section
  welcomeSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 28,
    overflow: "hidden",
  },
  welcomeGradient: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "left",
    lineHeight: 22,
    fontWeight: "500",
  },
  welcomeDecoration: {
    position: "absolute",
    right: -20,
    top: -10,
  },
  decorationCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    position: "absolute",
  },
  decorationCircle2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    right: 30,
    top: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  
  // Categories Section
  categoriesSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  
  // Products Section
  latestProductsSection: {
    marginHorizontal: 10,
    marginBottom: 24,
  },
  productsGrid: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  productsRow: {
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  productsSeparator: {
    height: 16,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
    textAlign: "left",
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "left",
    fontWeight: "500",
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#e98c22",
    fontWeight: "600",
    marginLeft: 6,
  },
  viewMoreIcon: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  viewMoreArrow: {
    fontSize: 14,
    color: "#e98c22",
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
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F3F4F6",
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
    backgroundColor: "#e98c22",
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
    backgroundColor: "#FFFFFF",
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  arrowIcon: {
    fontSize: 14,
    color: "#e98c22",
    fontWeight: "bold",
  },
  
  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bottomSheetIndicator: {
    backgroundColor: "#D1D5DB",
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  
  // Spacing
  bottomSpacing: {
    height: 100,
  },
});