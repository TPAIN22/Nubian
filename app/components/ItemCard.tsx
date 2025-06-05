import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image as RNImage,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const PLACEHOLDER_IMAGE_URI = "https://via.placeholder.com/150";

interface ProductItem {
  images?: string[];
  image?: string;
  name: string;
  price: number;
  discountPrice?: number;
}

export default function ItemCard({
  item,
  onAddPress, // تم تغيير اسم الـ prop هنا
}: {
  item: ProductItem;
  onAddPress?: () => void; // هذا الـ prop هو دالة لا تأخذ معلمات
}) {
  if (!item || !item.name || typeof item.price !== "number") {
    console.warn("ItemCard received invalid item prop:", item);
    return null;
  }

  const [imageHeight, setImageHeight] = useState(160);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { width } = useWindowDimensions();

  const CARD_HORIZONTAL_MARGIN = 4;
  const PADDING_FLATLIST = 4;
  const cardWidth =
    (width - PADDING_FLATLIST * 2 - CARD_HORIZONTAL_MARGIN * 2) / 2;

  const safeItem = useMemo(
    () => ({
      name: item.name,
      price: item.price,
      discountPrice:
        typeof item.discountPrice === "number" ? item.discountPrice : undefined,
      images: item.images || [],
      image: item.image || null,
    }),
    [item]
  );

  const imageUris = useMemo(() => {
    if (safeItem.images && safeItem.images.length > 0) {
      return safeItem.images.filter((uri) => uri && typeof uri === "string");
    }
    if (safeItem.image && typeof safeItem.image === "string") {
      return [safeItem.image];
    }
    return [PLACEHOLDER_IMAGE_URI];
  }, [safeItem.images, safeItem.image]);

  const calculateImageHeight = useCallback(
    (uri: string) => {
      if (!uri || typeof uri !== "string" || uri.startsWith("data:")) {
        setImageHeight(160);
        return;
      }

      RNImage.getSize(
        uri,
        (imgWidth, imgHeight) => {
          if (imgWidth === 0 || imgHeight === 0) {
            setImageHeight(160);
            return;
          }
          const ratio = imgHeight / imgWidth;
          const calculatedHeight = ratio * cardWidth;
          setImageHeight(
            calculatedHeight < 160 ? 160 : Math.min(calculatedHeight, 220)
          );
        },
        (error) => {
          console.warn("Failed to get image size for uri:", uri, error);
          setImageHeight(160);
        }
      );
    },
    [cardWidth]
  );

  useEffect(() => {
    if (imageUris.length > 0) {
      calculateImageHeight(imageUris[0]);
    }
  }, [imageUris, calculateImageHeight]);

  const handleScroll = useCallback(
    (event: any) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / cardWidth);
      setCurrentImageIndex(Math.max(0, Math.min(index, imageUris.length - 1)));
    },
    [cardWidth, imageUris.length]
  );

  const discountPercentage = useMemo(() => {
    if (
      safeItem.discountPrice !== undefined &&
      safeItem.discountPrice > safeItem.price
    ) {
      const percentage = Math.round(
        ((safeItem.discountPrice - safeItem.price) / safeItem.discountPrice) *
          100
      );
      return Math.max(0, Math.min(percentage, 99));
    }
    return 0;
  }, [safeItem.discountPrice, safeItem.price]);
  const handlePress = async () => {};

  const hasValidDiscount = discountPercentage > 0;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: cardWidth, height: imageHeight }}
        >
          {imageUris.map((uri, index) => (
            <Image
              key={`image-${index}`}
              source={{ uri }}
              style={{
                width: cardWidth,
                height: imageHeight,
              }}
              contentFit="cover"
              placeholder={{ uri: PLACEHOLDER_IMAGE_URI }}
            />
          ))}
        </ScrollView>

        {hasValidDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>خصم {discountPercentage}%</Text>
          </View>
        )}

        {imageUris.length > 1 && (
          <View style={styles.indicatorContainer}>
            {imageUris.map((_, index) => (
              <View
                key={`indicator-${index}`}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === currentImageIndex ? "#e98c22" : "#FFFFFF80",
                  },
                ]}
                accessibilityLabel={`صورة ${index + 1} من ${imageUris.length}`}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={2}
          accessibilityRole="text"
          accessibilityLabel={`اسم المنتج: ${safeItem.name}`}
        >
          {safeItem.name}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            {hasValidDiscount && (
              <Text style={styles.fakePrice}>
                {safeItem.discountPrice} جنيه
              </Text>
            )}
            <Text
              style={styles.price}
              accessibilityLabel={`السعر: ${safeItem.price} جنيه سوداني`}
            >
              {safeItem.price} جنيه
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`إضافة ${safeItem.name} إلى السلة`}
          >
            <Ionicons name="add-circle-outline" size={32} color="##30a1a7" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#30a1a7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "right",
    color: "#2D3748",
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  fakePrice: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A74949FF",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#30a1a7",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "white",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});