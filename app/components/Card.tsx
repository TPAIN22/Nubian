
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

interface item {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  discountPrice?: number;
}

function ItemCard({ item, handleSheetChanges, handlePresentModalPress }: any) {
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

  const discountPercentage = calculateDiscountPercentage(
    item.discountPrice,
    item.price || 0
  );

  const handleClick = (item: item) => {
    router.push({
      pathname: '/details/[details]',
      params: {
        details: String(item._id),
        name: item.name || '',
        price: String(item.price ?? ''),
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
    >
      <Image
        source={imageUri}
        alt="product image"
        style={{
          height: 210,
          width: cardWidth,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
        contentFit="fill"
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
              index === currentImageIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    );
  };
  return (
    <Card className="p-0 rounded-lg " style={{ width: cardWidth }}>
      <View style={{ height: 210, overflow: "hidden" }}>
        <Pressable
          onPress={handleWishlistPress}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
        >
          <Ionicons
            name={inWishlist ? 'heart' : 'heart-outline'}
            size={24}
            color={Colors.danger}
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
          getItemLayout={(data: any, index: number) => ({
            length: cardWidth,
            offset: cardWidth * index,
            index,
          })}
        />
        {renderPagination()}
      </View>
      <View className="px-4 pb-2">
        <VStack className="">
          <Heading size="sm" style={{ color: Colors.text.mediumGray }}>
            {item.name}
          </Heading>
          {item.discountPrice > 0 && (
            <Text style={{ textDecorationLine: 'line-through', color: Colors.primary }}>
              {item.discountPrice > 0 && formatPrice(item.discountPrice)}
            </Text>
          )}
          <Text style={{ color: Colors.text.mediumGray, fontWeight: 'bold', fontSize: 16 }}>
            {formatPrice(item.price)}
          </Text>
        </VStack>
      </View>
      {discountPercentage > 0 && (
        <View
          style={[
            styles.discountBadge,
            discountPercentage > 50
              ? { backgroundColor: "green" }
              : discountPercentage > 25
              ? { backgroundColor: "orange" }
              : discountPercentage > 10
              ? { backgroundColor: "red" }
              : { backgroundColor: "blue" },
          ]}
        >
          <Text style={styles.discountText}>{discountPercentage}% {i18n.t('off')}</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  discountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-end",
    marginBottom: 10,
    shadowColor: Colors.shadow,
    position: "absolute",
    top: 5,
    right: 5,
  },
  discountText: {
    color: Colors.text.white,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "left",
    fontFamily: "System",
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
  },
});

export default React.memo(ItemCard);
