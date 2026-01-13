import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, FlatList, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Image } from "expo-image";
import { Image as RNImage } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/providers/ThemeProvider";
import { useResponsive } from "@/hooks/useResponsive";
import { getFinalPrice, getOriginalPrice, hasDiscount, calculateDiscountPercentage, formatPrice as formatPriceUtil } from "@/utils/priceUtils";
import useWishlistStore from "@/store/wishlistStore";
import { useAuth } from "@clerk/clerk-expo";
import { navigateToProduct } from "@/utils/deepLinks";
import useTracking from "@/hooks/useTracking";
import useItemStore from "@/store/useItemStore";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  discountPrice?: number;
  stock?: number;
}

interface ProductCardProps {
  item: Product;
  onPress?: () => void;
  variant?: "grid" | "horizontal";
  showWishlist?: boolean;
  cardWidth?: number; // Optional: if provided, use this width (for horizontal lists)
}

/**
 * Unified responsive ProductCard component
 * Works on all screen sizes: phones, tablets, foldables, landscape
 */
const ProductCard = React.memo(({ 
  item, 
  onPress,
  variant = "grid",
  showWishlist = true,
  cardWidth: providedCardWidth,
}: ProductCardProps) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { window } = useResponsive();
  const { width: screenWidth } = useWindowDimensions();
  const { setProduct } = useItemStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();
  const { trackEvent } = useTracking();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inWishlist = isInWishlist(item._id);

  // Filter and deduplicate images
  const validImages = React.useMemo(() => {
    if (!item.images || item.images.length === 0) return [];
    // Filter out empty, null, undefined, and duplicate images
    const seen = new Set<string>();
    return item.images.filter((img: string) => {
      if (!img || typeof img !== 'string' || img.trim() === '') return false;
      if (seen.has(img)) return false;
      seen.add(img);
      return true;
    });
  }, [item.images]);

  // Use first image if only one exists, or if no valid images
  const singleImage = validImages.length === 1 ? validImages[0] : null;

  // Calculate card width
  // If provided via props (for horizontal lists), use it
  // Otherwise, calculate based on variant
  let cardWidth: number | undefined;
  
  if (providedCardWidth) {
    cardWidth = providedCardWidth;
  } else if (variant === "horizontal") {
    cardWidth = screenWidth - 32; // Full width minus padding
  } else {
    // For grid variant, don't set width - let parent FlatList with numColumns handle it
    cardWidth = undefined;
  }

  // Price calculations
  const originalPrice = getOriginalPrice(item);
  const finalPrice = getFinalPrice(item);
  const productHasDiscount = hasDiscount(item);
  const discountPercentage = productHasDiscount 
    ? calculateDiscountPercentage(originalPrice, finalPrice)
    : 0;

  const handleClick = () => {
    if (onPress) {
      onPress();
      return;
    }

    trackEvent('product_click', {
      productId: item._id,
      screen: 'product_card',
    });
    
    navigateToProduct(item._id, item);
    requestAnimationFrame(() => {
      setTimeout(() => setProduct(item), 0);
      try {
        const images = item.images || [];
        images.slice(0, 2).forEach((uri) => {
          if (typeof uri === 'string' && uri) RNImage.prefetch(uri).catch(() => {});
        });
      } catch {}
    });
  };

  const handleWishlistPress = async () => {
    const token = await getToken();
    if (inWishlist) {
      removeFromWishlist(item._id, token);
    } else {
      addToWishlist(item, token);
      trackEvent('wishlist_add', {
        productId: item._id,
        screen: 'product_card',
      });
    }
  };

  const renderImage = ({ item: imageUri }: { item: string }) => {
    // For FlatList carousel, each image must be exactly the container width
    const imageWidth = cardWidth || containerWidth;
    if (!imageWidth) return null;
    
    return (
      <View style={{ width: imageWidth, height: imageWidth }}>
        <Pressable onPress={handleClick} style={{ width: '100%', height: '100%' }}>
          <Image
            source={{ uri: imageUri }}
            alt="product image"
            style={[
              styles.productImage,
              { 
                backgroundColor: colors.surface,
                width: '100%',
                height: '100%',
              }
            ]}
            contentFit="cover"
            transition={300}
          />
        </Pressable>
      </View>
    );
  };

  const handleContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && !cardWidth) {
      setContainerWidth(width);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const renderPagination = () => {
    if (validImages.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {validImages.map((image: string, index: number) => (
          <View
            key={`${image}-${index}`}
            style={[
              styles.paginationDot,
              { backgroundColor: colors.overlayLight },
              index === currentImageIndex && { backgroundColor: colors.primary }
            ]}
          />
        ))}
      </View>
    );
  };

  // Horizontal variant (for cart or similar)
  if (variant === "horizontal") {
    return (
      <Card className="p-0" style={[styles.productCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.horizontalContainer}>
          <Pressable onPress={handleClick} style={styles.horizontalImageContainer}>
            <Image
              source={{ uri: validImages[0] || item.images?.[0] }}
              alt="product image"
              style={[
                styles.horizontalImage,
                { 
                  backgroundColor: colors.surface,
                  aspectRatio: 1,
                }
              ]}
              contentFit="cover"
              transition={300}
            />
          </Pressable>
          
          <View style={styles.horizontalInfo}>
            <Pressable onPress={handleClick} style={styles.horizontalNameContainer}>
              <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={2}>
                {item.name}
              </Heading>
            </Pressable>
            
            <View style={styles.horizontalPriceContainer}>
              {productHasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>
                  {formatPriceUtil(originalPrice)}
                </Text>
              )}
              <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
                {formatPriceUtil(finalPrice)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  }

  // Grid variant (default)
  return (
    <Card className="p-0" style={[styles.productCard, cardWidth ? { width: cardWidth } : styles.productCardFlex, { backgroundColor: colors.cardBackground }]}>
      <View style={[
        styles.imageContainer, 
        { 
          backgroundColor: colors.surface,
          width: cardWidth || '100%',
          aspectRatio: 1, // Always maintain square aspect ratio
        }
      ]}>
        {showWishlist && (
          <Pressable
            onPress={handleWishlistPress}
            style={[styles.wishlistButton, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
          >
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={20}
              color={inWishlist ? colors.danger : colors.primary}
            />
          </Pressable>
        )}
        {singleImage ? (
          // Single image - use simple Image component
          <Pressable onPress={handleClick} style={styles.imagePressable}>
            <Image
              source={{ uri: singleImage }}
              alt="product image"
              style={[
                styles.productImage,
                { 
                  backgroundColor: colors.surface,
                  width: '100%',
                  height: '100%',
                }
              ]}
              contentFit="cover"
              transition={300}
            />
          </Pressable>
        ) : validImages.length > 1 ? (
          // Multiple images - use FlatList carousel
          <>
            <View 
              style={[
                cardWidth ? { width: cardWidth, height: cardWidth } : styles.imageContainerWrapper,
                { overflow: 'hidden' }
              ]}
              onLayout={handleContainerLayout}
            >
              {(cardWidth || containerWidth) ? (
                <FlatList
                  ref={flatListRef}
                  data={validImages}
                  renderItem={renderImage}
                  keyExtractor={(img: string, index: number) => `${img}-${index}`}
                  horizontal={true}
                  pagingEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                  snapToInterval={cardWidth || containerWidth || undefined}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  scrollEnabled={true}
                  bounces={false}
                  nestedScrollEnabled={false}
                  getItemLayout={(cardWidth || containerWidth) ? (_data: any, index: number) => {
                    const width = cardWidth || containerWidth || 0;
                    return {
                      length: width,
                      offset: width * index,
                      index,
                    };
                  } : undefined}
                  style={{
                    width: cardWidth || containerWidth || '100%',
                    height: cardWidth || containerWidth || '100%',
                  }}
                  contentContainerStyle={{
                    width: ((cardWidth || containerWidth || 0) * validImages.length),
                    height: cardWidth || containerWidth || '100%',
                  }}
                />
              ) : (
                // Render first image while measuring container
                <Pressable onPress={handleClick} style={styles.imagePressable}>
                  <Image
                    source={{ uri: validImages[0] }}
                    alt="product image"
                    style={[
                      styles.productImage,
                      { 
                        backgroundColor: colors.surface,
                        width: '100%',
                        height: '100%',
                      }
                    ]}
                    contentFit="cover"
                    transition={300}
                  />
                </Pressable>
              )}
            </View>
            {renderPagination()}
          </>
        ) : (
          // No images - show placeholder
          <Pressable onPress={handleClick} style={styles.imagePressable}>
            <View style={[
              styles.productImage,
              { 
                backgroundColor: colors.surface,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}>
              <Ionicons name="image-outline" size={48} color={colors.text.veryLightGray} />
            </View>
          </Pressable>
        )}
        {discountPercentage > 0 && (
          <View
            style={[
              styles.discountBadge,
              discountPercentage > 50
                ? { backgroundColor: colors.success }
                : discountPercentage > 25
                ? { backgroundColor: colors.warning }
                : discountPercentage > 10
                ? { backgroundColor: colors.danger }
                : { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.discountText}>{discountPercentage}%</Text>
          </View>
        )}
        {(item.stock || 0) === 0 && (
          <View style={[styles.outOfStockOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Pressable onPress={handleClick}>
          <Heading size="sm" style={[styles.productName, { color: colors.text.gray }]} numberOfLines={2}>
            {item.name}
          </Heading>
        </Pressable>
        <View style={styles.priceContainer}>
          {productHasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]} numberOfLines={1}>
              {formatPriceUtil(originalPrice)}
            </Text>
          )}
          <Text style={[styles.currentPrice, { color: colors.primary }]} numberOfLines={1}>
            {formatPriceUtil(finalPrice)}
          </Text>
        </View>
      </View>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  productCardFlex: {
    flex: 1,
  },
  imagePressable: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    minHeight: 0, // Prevent expansion
  },
  imageContainerWrapper: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: "700",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "bold",
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 60, // Ensure space for title and price
  },
  productName: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36, // Reserve space for 2 lines
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
    minHeight: 20, // Ensure price is always visible
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontSize: 11,
    fontWeight: "400",
  },
  currentPrice: {
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 0, // Never shrink price
  },
  // Horizontal variant styles
  horizontalContainer: {
    flexDirection: "row",
    padding: 12,
  },
  horizontalImageContainer: {
    marginRight: 12,
  },
  horizontalImage: {
    width: 100,
    borderRadius: 8,
  },
  horizontalInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  horizontalNameContainer: {
    marginBottom: 8,
  },
  horizontalPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
});

export default ProductCard;
