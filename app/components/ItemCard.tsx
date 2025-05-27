import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image as RNImage,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

export default function ItemCard({
  item,
  onAddPress,
}: {
  item: {
    images: string[];
    image: string;
    name: string;
    discountPrice: number;
  };
  onAddPress?: () => void;
}) {
  const [imageHeight, setImageHeight] = useState(160);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { width } = useWindowDimensions();
  const cardWidth = width / 2 - 16;

  const imageUris = item.images?.length ? item.images : [item.image];

  useEffect(() => {
    const uri = imageUris[0];
    if (!uri) return;

    RNImage.getSize(
      uri,
      (imgWidth, imgHeight) => {
        const ratio = imgHeight / imgWidth;
        const calculatedHeight = ratio * cardWidth;
        setImageHeight(
          calculatedHeight < 160 ? 160 : Math.min(calculatedHeight, 220)
        );
      },
      () => {
        setImageHeight(160);
      }
    );
  }, [item.images, item.image, cardWidth]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentImageIndex(index);
  };

  const discountPercentage = Math.round(
    ((item.discountPrice - item.price) / item.discountPrice) * 100
  );

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {/* Image Carousel */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={{ width: "100%", height: imageHeight }}
        >
          {imageUris.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={{
                width: cardWidth,
                height: imageHeight,
              }}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Discount Badge */}
        {item.discountPrice !== item.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercentage}%</Text>
          </View>
        )}

        {/* Image Indicators */}
        {imageUris.length > 1 && (
          <View style={styles.indicatorContainer}>
            {imageUris.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor:
                      index === currentImageIndex ? "#A37E2C" : "#FFFFFF80",
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            {item.discountPrice !== item.price && (
              <Text style={styles.fakePrice}>{item.discountPrice} جنيه</Text>
            )}

            <Text style={styles.price}>{item.price} جنيه</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
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
    margin: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
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
    backgroundColor: "#E53E3E",
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
    color: "#38A169",
  },
  addButton: {
    backgroundColor: "#A37E2C",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
    shadowColor: "#A37E2C",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
