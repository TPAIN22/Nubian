import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  ActivityIndicator,
  Text,
  Pressable,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Image as RNImage,
  ScrollView,
} from "react-native";
import ItemCardSkeleton from "@/app/components/ItemCardSkeleton";
import ItemCard from "@/app/components/ItemCard";
import { useHeaderHeight } from "@react-navigation/elements";
import ImageSlider from "@/app/components/ImageSlide";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import useItemStore from "@/store/useItemStore";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import HomeHeaderContent from "./headerContent";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AddToCartButton from "@/app/components/AddToCartButton";
import { Image } from "expo-image";
import MasonryList from "@react-native-seoul/masonry-list";
import styles from "./styles";
// Import from reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  image?: string;
  discountPrice?: number;
  sizes?: string[];
  description?: string;
}

const { width: screenWidth } = Dimensions.get("window");
const IMAGE_HORIZONTAL_MARGIN = 20;
const SLIDER_IMAGE_WIDTH = screenWidth - IMAGE_HORIZONTAL_MARGIN;
const DEFAULT_IMAGE_HEIGHT = 250;
const PLACEHOLDER_IMAGE_URI =
  "https://via.placeholder.com/400x250?text=No+Image";

export default function Home() {
  const headerHeight = useHeaderHeight();
  // Changed this to control header's solid background directly, not just transparent
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const {
    products,
    isProductsLoading,
    getProducts,
    hasMore,
    setProduct,
    setIsTabBarVisible,
  } = useItemStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [calculatedImageHeight, setCalculatedImageHeight] =
    useState(DEFAULT_IMAGE_HEIGHT);

  const router = useRouter();
  const categoriesScrollRef = useRef<ScrollView>(null);
  const masonryListRef = useRef(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const hideTabBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reanimated shared values for animation
  const headerOpacity = useSharedValue(0); // 0 for transparent, 1 for solid
  const headerBorderOpacity = useSharedValue(0); // 0 for no border, 1 for border
  const headerTranslateY = useSharedValue(0); // For subtle slide effect (optional)

  const openBottomSheet = useCallback(
    (item: Product) => {
      setSelectedProduct(item);
      setQuantity(1);
      setSelectedSize(null);
      bottomSheetRef.current?.snapToIndex(0);
      setIsTabBarVisible(false); // Hide tab bar when bottom sheet is open
    },
    [setIsTabBarVisible]
  );

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setSelectedProduct(null);
    setQuantity(1);
    setSelectedSize(null);
    // When bottom sheet closes, handleScroll will take over
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Ensure tab bar is visible when screen gains focus
      if (hideTabBarTimeoutRef.current) {
        clearTimeout(hideTabBarTimeoutRef.current);
        hideTabBarTimeoutRef.current = null;
      }
      setIsTabBarVisible(true);
      // Ensure header is transparent when screen gains focus
      headerOpacity.value = withTiming(0, { duration: 200 });
      headerBorderOpacity.value = withTiming(0, { duration: 200 });
      headerTranslateY.value = withTiming(0, { duration: 200 });
      setIsHeaderSolid(false); // Reset the state
      return () => {
        // Optional: Hide tab bar when leaving screen, or handle this globally
      };
    }, [setIsTabBarVisible, headerOpacity, headerBorderOpacity, headerTranslateY])
  );

  const navigateToDetails = useCallback(
    (item: Product) => {
      setProduct(item);
      router.push(`/${item._id}`);
    },
    [setProduct, router]
  );

  const snapPoints = useMemo(() => ["55%"], []);
  const categories = useMemo(
    () => [
      { name: "إلكترونيات", icon: "phone-portrait-outline" },
      { name: "ملابس", icon: "shirt-outline" },
      { name: "منزل", icon: "home-outline" },
      { name: "رياضة", icon: "fitness-outline" },
    ],
    []
  );

  const lastScrollY = useRef(0);
  const handleScroll = useCallback(
    (event: any) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const scrollDirection = currentY > lastScrollY.current ? "down" : "up";
      const scrollDifference = Math.abs(currentY - lastScrollY.current);
      lastScrollY.current = currentY;

      const headerChangeThreshold = 90; // When header becomes solid / transparent
      const tabBarHideThreshold = 150; // When tab bar hides (can be different from header)
      const tabBarShowScrollUpThreshold = 10; // How much to scroll up to show tab bar quickly

      // --- Header Transparency & Animation Logic ---
      if (currentY > headerChangeThreshold && !isHeaderSolid) {
        // Scrolled down past threshold, make header solid with animation
        setIsHeaderSolid(true);
        headerOpacity.value = withTiming(1, { duration: 300 }); // Animate opacity to 1
        headerBorderOpacity.value = withTiming(1, { duration: 300 }); // Animate border opacity
        headerTranslateY.value = withTiming(0, { duration: 300 }); // Ensure it's at 0
      } else if (currentY <= headerChangeThreshold && isHeaderSolid) {
        // Scrolled back to top, make header transparent with animation
        setIsHeaderSolid(false);
        headerOpacity.value = withTiming(0, { duration: 300 }); // Animate opacity to 0
        headerBorderOpacity.value = withTiming(0, { duration: 300 }); // Animate border opacity
        headerTranslateY.value = withTiming(0, { duration: 300 }); // Ensure it's at 0
      }

      // --- Tab Bar Visibility Logic ---
      // Hide tab bar when scrolling down significantly
      if (currentY > tabBarHideThreshold && scrollDirection === "down") {
        if (hideTabBarTimeoutRef.current) {
          clearTimeout(hideTabBarTimeoutRef.current);
        }
        hideTabBarTimeoutRef.current = setTimeout(() => {
          setIsTabBarVisible(false);
          hideTabBarTimeoutRef.current = null;
        }, 150); // Slight delay for hiding
      }
      // Show tab bar when scrolling up significantly OR when back at the very top
      else if (
        (scrollDirection === "up" &&
          scrollDifference > tabBarShowScrollUpThreshold) ||
        currentY <= headerChangeThreshold // Also show if at the very top (header threshold)
      ) {
        if (hideTabBarTimeoutRef.current) {
          clearTimeout(hideTabBarTimeoutRef.current);
          hideTabBarTimeoutRef.current = null;
        }
        setIsTabBarVisible(true); // Show immediately
      }
    },
    [isHeaderSolid, setIsTabBarVisible, headerOpacity, headerBorderOpacity, headerTranslateY]
  );

  // Animated style for the custom header background
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      // You can also use translateY for a subtle slide in/out effect
      // transform: [{ translateY: headerTranslateY.value }],
      backgroundColor: `rgba(255, 255, 255, ${headerOpacity.value})`, // Animate background color transparency
      borderBottomColor: `rgba(226, 232, 240, ${headerBorderOpacity.value})`, // Animate border color transparency
      borderBottomWidth: headerBorderOpacity.value > 0 ? 1 : 0, // Only show border if opacity is greater than 0
    };
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getProducts(true);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [getProducts]);

  const loadMoreProducts = useCallback(async () => {
    if (!isProductsLoading && hasMore) {
      setIsLoadingMore(true);
      try {
        await getProducts();
      } catch (error) {
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [isProductsLoading, hasMore, getProducts, products.length, searchQuery]);

  const skeletonItems = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, index) => ({
        _id: `skeleton-${index}`,
        skeleton: true,
      })),
    []
  );

  useEffect(() => {
    const fetchInitialProducts = async () => {
      if (products.length === 0 && !isProductsLoading) {
        await getProducts(true);
      }
    };
    fetchInitialProducts();
  }, [products.length, isProductsLoading, getProducts]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const itemWidth = 80;
    const totalContentWidth =
      categories.length * itemWidth + (categories.length - 1) * 16;
    const screenWidth = Dimensions.get("window").width;
    let currentScrollX = 0;

    const startAutoScroll = () => {
      intervalId = setInterval(() => {
        if (categoriesScrollRef.current) {
          if (currentScrollX >= totalContentWidth - screenWidth) {
            currentScrollX = 0;
          } else {
            currentScrollX += 0.5;
          }
          categoriesScrollRef.current.scrollTo({
            x: currentScrollX,
            animated: false,
          });
        }
      }, 20);
    };

    const timer = setTimeout(startAutoScroll, 1000);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter((product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const dataToRender =
    isProductsLoading && products.length === 0
      ? skeletonItems
      : filteredProducts;

  const handleCategoryPress = (categoryName: string) => {
    setSearchQuery(categoryName);
  };

  const renderProductItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.skeleton) {
        return <ItemCardSkeleton />;
      }
      return (
        <Pressable
          onPress={() => navigateToDetails(item)}
          style={styles.itemPressable}
        >
          <ItemCard item={item} onAddPress={() => openBottomSheet(item)} />
        </Pressable>
      );
    },
    [navigateToDetails, openBottomSheet]
  );

  const renderFooter = useCallback(() => {
    if (isProductsLoading && products.length > 0 && hasMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="large" color="#e98c22" />
        </View>
      );
    }

    if (!hasMore && products.length > 0 && dataToRender.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.noMoreProductsText}>لا توجد منتجات إضافية</Text>
        </View>
      );
    }

    return null;
  }, [isProductsLoading, hasMore, products.length, dataToRender.length]);

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color="#CBD5E0" />
        <Text style={styles.emptyText}>
          {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد منتجات"}
        </Text>
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchText}>مسح البحث</Text>
          </Pressable>
        )}
      </View>
    ),
    [searchQuery]
  );

  const RenderMasonryListHeader = useCallback(
    () => (
      <>
        <View style={styles.sliderContainer}>
          <ImageSlider />
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollView}
            ref={categoriesScrollRef} // Use ref for auto-scrolling categories
          >
            {categories.map((category, index) => (
              <Pressable
                key={index}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.name)}
              >
                <View style={styles.categoryIconContainer}>
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color="#e98c22"
                  />
                </View>
                <Text style={styles.categoryText}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionHeaderContainer}>
          <Pressable>
            <Text style={styles.viewAllText}>عرض الكل</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `نتائج البحث: ${searchQuery}` : "أحدث المنتجات"}
          </Text>
        </View>
      </>
    ),
    [categories, searchQuery, handleCategoryPress]
  );

  const productImages = useMemo(() => {
    if (selectedProduct?.images?.length) {
      return selectedProduct.images;
    }
    if (selectedProduct?.image) {
      return [selectedProduct.image];
    }
    return [PLACEHOLDER_IMAGE_URI];
  }, [selectedProduct?.images, selectedProduct?.image]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    const uri = productImages[0];
    if (!uri || uri === PLACEHOLDER_IMAGE_URI) {
      setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
      return;
    }

    RNImage.getSize(
      uri,
      (imgWidth, imgHeight) => {
        if (imgWidth === 0) {
          setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
          return;
        }
        const aspectRatio = imgHeight / imgWidth;
        const newHeight = aspectRatio * SLIDER_IMAGE_WIDTH;
        setCalculatedImageHeight(Math.min(newHeight, 400));
      },
      (error) => {
        setCalculatedImageHeight(DEFAULT_IMAGE_HEIGHT);
      }
    );
  }, [productImages, selectedProduct]);

  const handleSizeSelection = useCallback((size: string) => {
    setSelectedSize(size);
  }, []);

  const handleIncrementQuantity = useCallback(() => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  }, []);

  const handleDecrementQuantity = useCallback(() => {
    setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }, []);

  return (
    <>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style= "dark"  />
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerStyle: { backgroundColor: "transparent" }, 
            headerShadowVisible: false, 
            headerTitle: () => (
              <HomeHeaderContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                borderColor='#e98c22'
              />
            ),
          }}
        />

        {/* Custom Animated Header Background Overlay */}
        <Animated.View
          style={[
            styles.animatedHeaderBackground,
            { height: headerHeight },
            animatedHeaderStyle,
          ]}
        />

        <MasonryList
          data={dataToRender}
          keyExtractor={(item) =>
            item._id?.toString() || Math.random().toString()
          }
          numColumns={2}
          
          showsVerticalScrollIndicator={false}
          renderItem={renderProductItem}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={RenderMasonryListHeader()}
          ListFooterComponent={renderFooter()}
          ListEmptyComponent={
            !isProductsLoading && products.length === 0
              ? renderEmptyComponent()
              : null
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={
            styles.masonryListContentContainer}
        />

        {isProductsLoading && products.length === 0 && (
          <View style={styles.initialLoadingOverlay}>
            <ActivityIndicator size="large" color="#e98c22" />
            <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
          </View>
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          onClose={closeBottomSheet}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetHandleIndicator}
        >
          <BottomSheetScrollView style={styles.bottomSheetContent}>
            {selectedProduct ? (
              <>
                <BottomSheetScrollView
                  style={styles.bottomSheetScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={
                    styles.bottomSheetScrollContentContainer
                  }
                >
                  <View style={styles.imageSliderContainerDetails}>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.imageScrollViewDetails}
                      contentContainerStyle={styles.imageScrollContentDetails}
                    >
                      {productImages.map((imgUri, index) => (
                        <Image
                          key={index}
                          source={{ uri: imgUri }}
                          style={[
                            styles.productImageDetails,
                            { height: calculatedImageHeight },
                          ]}
                          contentFit="cover"
                          accessibilityLabel={`صورة المنتج ${index + 1} من ${
                            productImages.length
                          }`}
                        />
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.detailsContainerDetails}>
                    <Text
                      style={styles.productNameDetails}
                      accessibilityRole="header"
                    >
                      {selectedProduct.name}
                    </Text>

                    {selectedProduct.discountPrice ? (
                      <View style={styles.priceRow}>
                        <Text
                          style={styles.productPriceDetailsDiscounted}
                          accessibilityLabel={`السعر الأصلي: ${selectedProduct.price} جنيه سوداني`}
                        >
                          {`SDG ${selectedProduct.price}`}
                        </Text>
                        <Text
                          style={styles.productPriceDetails}
                          accessibilityLabel={`سعر التخفيض: ${selectedProduct.discountPrice} جنيه سوداني`}
                        >
                          {`SDG ${selectedProduct.discountPrice}`}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={styles.productPriceDetails}
                        accessibilityLabel={`سعر المنتج: ${selectedProduct.price} جنيه سوداني`}
                      >
                        SDG {selectedProduct.price}
                      </Text>
                    )}

                    {selectedProduct.sizes?.length! > 0 && (
                      <View style={styles.sizeSelectionContainerDetails}>
                        <Text style={styles.sectionHeading}>
                          المقاسات المتاحة:
                        </Text>
                        <View style={styles.sizeOptionsWrapper}>
                          {selectedProduct.sizes!.map((size, index) => {
                            const isSelected = selectedSize === size;
                            return (
                              <TouchableOpacity
                                key={index}
                                onPress={() => handleSizeSelection(size)}
                                style={[
                                  styles.sizeOptionDetails,
                                  isSelected && styles.selectedSizeDetails,
                                ]}
                                accessibilityLabel={`اختيار المقاس ${size}`}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: isSelected }}
                              >
                                <Text
                                  style={[
                                    styles.sizeTextDetails,
                                    isSelected &&
                                      styles.selectedSizeTextDetails,
                                  ]}
                                >
                                  {size}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <View style={styles.quantityContainerDetails}>
                      <Text style={styles.sectionHeading}>الكمية:</Text>
                      <View style={styles.quantityControlDetails}>
                        <TouchableOpacity
                          onPress={handleDecrementQuantity}
                          accessibilityLabel="تقليل الكمية"
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name="remove-circle"
                            size={38}
                            color="#e98c22"
                          />
                        </TouchableOpacity>
                        <Text
                          style={styles.quantityTextDetails}
                          accessibilityLabel={`الكمية المختارة: ${quantity}`}
                        >
                          {quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={handleIncrementQuantity}
                          accessibilityLabel="زيادة الكمية"
                          accessibilityRole="button"
                        >
                          <Ionicons
                            name="add-circle"
                            size={38}
                            color="#e98c22"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {selectedProduct.description && (
                      <View style={styles.descriptionContainerDetails}>
                        <Text style={styles.descriptionLabelDetails}>
                          الوصف:
                        </Text>
                        <Text
                          style={styles.descriptionTextDetails}
                          accessibilityLabel={`وصف المنتج: ${selectedProduct.description}`}
                        >
                          {selectedProduct.description}
                        </Text>
                      </View>
                    )}
                  </View>
                </BottomSheetScrollView>

                <View style={styles.addToCartContainer}>
                  <AddToCartButton
                    product={{
                      ...selectedProduct,
                      size: selectedSize || undefined,
                      quantity,
                    }}
                    title="اضافة الى السلة"
                    textStyle={styles.addToCartTextDetails}
                    buttonStyle={styles.addToCartButtonDetails}
                  />
                </View>
              </>
            ) : (
              <View style={styles.loadingContainerBottomSheet}>
                <Text style={styles.loadingTextBottomSheet}>
                  جاري تحميل تفاصيل المنتج...
                </Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
    </>
  );
}

// --- الأنماط (Styles) ---
