
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import { Image as RNImage } from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import { Dimensions, Pressable, StyleSheet, View, FlatList } from "react-native";
import i18n from "@/utils/i18n";
import useWishlistStore from '@/store/wishlistStore';
import { useAuth } from '@clerk/clerk-expo';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from "@/locales/brandColors";
import { useTheme } from "@/providers/ThemeProvider";

interface item {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  discountPrice?: number;
}

function ItemCard({ item, handleSheetChanges, handlePresentModalPress }: any) {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { setProduct } = useItemStore();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 20;
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { getToken } = useAuth();
  const inWishlist = isInWishlist(item._id);

  const formatPrice = (price: number) => {
    // Validate price is a valid number
    if (price === null || price === undefined || isNaN(price) || typeof price !== 'number') {
      return new Intl.NumberFormat("ar-SDG", {
        style: "currency",
        currency: "SDG",
      }).format(0);
    }
    return new Intl.NumberFormat("ar-SDG", {
      style: "currency",
      currency: "SDG",
    }).format(price);
  };

  const calculateDiscountPercentage = (
    originalPrice: number,
    discountedPrice: number
  ) => {
    if (
      !originalPrice ||
      !discountedPrice ||
      originalPrice <= 0 ||
      discountedPrice < 0
    ) {
      return 0;
    }

    if (discountedPrice >= originalPrice) {
      return 0;
    }
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Ensure prices are valid numbers
  // price = original price, discountPrice = final selling price (after discount)
  const originalPrice = typeof item.price === 'number' && !isNaN(item.price) && item.price > 0 ? item.price : 0;
  const finalPrice = typeof item.discountPrice === 'number' && !isNaN(item.discountPrice) && item.discountPrice > 0 
    ? item.discountPrice 
    : originalPrice; // Fallback to original price if no discount

  // Calculate discount percentage: ((original - final) / original) * 100
  const discountPercentage = calculateDiscountPercentage(
    originalPrice,
    finalPrice
  );

  const handleClick = (item: item) => {
    router.push({
      pathname: '/details/[details]',
      params: {
        details: String(item._id),
        name: item.name || '',
        price: String(finalPrice),
        image: item.images?.[0] || '',
      },
    } as any);
    // Defer any heavy work until after interactions & frame rendered
    requestAnimationFrame(() => {
      setTimeout(() => setProduct(item), 0);
      try {
        // Prefetch up to first 2 images to improve detail load
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
    }
  };

  const renderImage = ({ item: imageUri }: { item: string }) => (
    <Pressable
      onPressIn={() => {
        try {
          // Prefetch first image (route types are strict; use object form if needed)
          (router as any)?.prefetch?.({ pathname: '/details/[details]', params: { details: String(item._id) } });
          if (typeof imageUri === 'string' && imageUri) {
            RNImage.prefetch(imageUri).catch(() => {});
          }
        } catch {}
      }}
      onPress={() => handleClick(item)}
      style={{ width: cardWidth }}
    >
      <Image
        source={{ uri: imageUri }}
        alt="product image"
        style={[styles.productImage, { width: cardWidth, backgroundColor: Colors.surface }]}
        contentFit="cover"
        transition={300}
      />
    </Pressable>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const renderPagination = () => {
    if (!item.images || item.images.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {item.images.map((image: string, index: number) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              { backgroundColor: Colors.overlayLight },
              index === currentImageIndex && { backgroundColor: Colors.primary }
            ]}
          />
        ))}
      </View>
    );
  };
  return (
    <Card className="p-0" style={[styles.productCard, { width: cardWidth, backgroundColor: Colors.cardBackground }]}>
      <View style={[styles.imageContainer, { backgroundColor: Colors.surface }]}>
        <Pressable
          onPress={handleWishlistPress}
          style={[styles.wishlistButton, { backgroundColor: Colors.cardBackground, borderColor: Colors.borderLight }]}
        >
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={20}
            color={inWishlist ? Colors.danger : Colors.primary}
          />
        </Pressable>
        <FlatList
          ref={flatListRef}
          data={item.images || []}
          renderItem={renderImage}
          keyExtractor={(item: string, index: number) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(_data: any, index: number) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
          style={{ width: cardWidth }}
        />
        {renderPagination()}
        {discountPercentage > 0 && (
          <View
            style={[
              styles.discountBadge,
              discountPercentage > 50
                ? { backgroundColor: Colors.success }
                : discountPercentage > 25
                ? { backgroundColor: Colors.warning }
                : discountPercentage > 10
                ? { backgroundColor: Colors.danger }
                : { backgroundColor: Colors.primary },
            ]}
          >
            <Text style={styles.discountText}>{discountPercentage}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Heading size="sm" style={[styles.productName, { color: Colors.text.gray }]} numberOfLines={2}>
          {item.name}
        </Heading>
        <View style={styles.priceContainer}>
          {/* Show original price (strikethrough) if there's a discount */}
          {discountPercentage > 0 && originalPrice > finalPrice && (
            <Text style={[styles.originalPrice, { color: Colors.text.veryLightGray }]}>
              {formatPrice(originalPrice)}
            </Text>
          )}
          {/* Show final price (discountPrice if exists, else original price) */}
          <Text style={[styles.currentPrice, { color: Colors.primary }]}>
            {formatPrice(finalPrice)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 14,
    overflow: "hidden",   
    marginBottom: 4,
  },
  imageContainer: {
    height: 200,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    height: 200,
    width: "100%",
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
  },
  discountText: {
    color: Colors.text.white,
    fontSize: 11,
    fontWeight: "700",
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 10,
  },
  productName: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 24,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 1,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontSize: 10,
    fontWeight: "400",
    flexShrink: 1,
  },
  currentPrice: {
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
  },
});

export default React.memo(ItemCard);
