import { memo } from "react";
import { View, FlatList, Pressable, StyleSheet, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { router } from "expo-router";
import {
  navigateToTrending,
  navigateToFlashDeals,
  navigateToNewArrivals,
  navigateToTopRated,
} from "@/utils/deepLinks";

const MOCK_COLLECTIONS = [
  { id: "1", title: "Brands", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80", action: () => router.push('/(tabs)/explore') },
  { id: "2", title: "New In", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80", action: () => navigateToNewArrivals() },
  { id: "3", title: "Spring &\nSummer", image: "https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=300&q=80", action: () => navigateToTrending() },
  { id: "4", title: "Plus-Size", image: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=300&q=80", action: () => navigateToTopRated() },
  { id: "5", title: "Fandom", image: "https://images.unsplash.com/photo-1583316174775-bd6dc0e9f298?w=300&q=80", action: () => navigateToFlashDeals() },
];

export const QuickCollections = memo(() => {
  const isRTL = I18nManager.isRTL;

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_COLLECTIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isRTL && { flexDirection: "row-reverse" },
        ]}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={item.action}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.overlay}
            />
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
});
QuickCollections.displayName = "QuickCollections";

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  card: {
    width: 90,
    height: 130,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  title: {
    position: "absolute",
    bottom: 8,
    left: 4,
    right: 4,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
