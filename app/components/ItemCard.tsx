import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Image as RNImage,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

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
  const cardWidth = width / 2 - 10;

  useEffect(() => {
    const uri = item.images?.[0] || item.image;

    RNImage.getSize(
      uri,
      (imgWidth, imgHeight) => {
        const ratio = imgHeight / imgWidth;
        const calculatedHeight = ratio * cardWidth;
        setImageHeight(calculatedHeight < 140 ? 140 : calculatedHeight);
      },
      () => {
        setImageHeight(120);
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <View>
            <Text style={styles.fakePrice}>SDG {item.price * 1.5}</Text>
          <Text style={styles.price}>SDG {item.price}</Text>
          </View>
          
          <Ionicons name="add-circle" size={34} color="#A37E2C" style={{alignSelf:"flex-end"}} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFFFF",
    borderRadius: 10,
    margin: 4,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 12,
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
  fakePrice: {
    alignSelf: "flex-end",
    textAlign: "right",
    fontSize: 12,
    fontWeight: "bold",
    maxWidth: 90,
    color: "#FF00005F",
    paddingHorizontal: 6,
    borderRadius: 4,
    padding: 4,
    textDecorationLine: "line-through",
  },
  price: {
    alignSelf: "flex-end",
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    maxWidth: 90,
    color: "#027A5AFF",
    paddingHorizontal: 6,
    borderRadius: 2,
    padding: 4,
  },
});
