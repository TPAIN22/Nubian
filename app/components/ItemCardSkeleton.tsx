// components/ItemCardSkeleton.tsx
import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Skeleton } from "moti/skeleton";

export default function ItemCardSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = width / 2 - 8;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Skeleton height={150} width={"100%"} radius={10} colorMode="light" />
      <View style={{ padding: 10, paddingTop: 0 , gap:5 }}>
        <Skeleton height={14} width={"70%"} radius={4} colorMode="light"/>
        <Skeleton height={12} width={60} radius={8} colorMode="light"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 4,
    gap: 10,
    elevation: 2,
    overflow: "hidden",
  },
});
