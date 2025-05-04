import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image as RNImage,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";

export default function ItemCard({
  item,
}: {
  item: {
    images: string[];
    image: string;
    name: string;
    price: number;
  };
}) {
  const [imageHeight, setImageHeight] = useState(120);
  const { width } = useWindowDimensions();
  const cardWidth = width / 2 - 8;

  useEffect(() => {
    const uri = item.images?.[2] || item.image;

    RNImage.getSize(
      uri,
      (imgWidth, imgHeight) => {
        const ratio = imgHeight / imgWidth;
        const calculatedHeight = ratio * cardWidth;
        setImageHeight(calculatedHeight < 120 ? 120 : calculatedHeight);
      },
      () => {
        setImageHeight(120); // fallback in case of error
      }
    );
  }, [item.images, item.image]);

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Image
        source={{ uri: item.images?.[2] || item.image }}
        style={[styles.productImage, { height: imageHeight }]}
        contentFit="cover"
      />
      <View style={{ padding: 10, paddingTop: 0 }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.price}>SD {item.price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    margin: 4,
    elevation: 2,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 10,
    textAlign: "right",
    color: "#444",
  },
  price: {
    alignSelf: "flex-end",
    textAlign: "right",
    fontSize: 12,
    fontWeight: "bold",
    maxWidth: 80,
    backgroundColor: "#FAF5DCFF",
    color: "#A37E2C",
    paddingHorizontal: 6,
    borderRadius: 8,
  },
});
