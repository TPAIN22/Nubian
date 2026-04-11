import { memo } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HomeCategory } from "@/api/home.api";
import { navigateToCategory } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";

export const CategoryGrid = memo(({ categories, colors }: { categories: HomeCategory[]; colors: any }) => {
  const { trackEvent } = useTracking();
  if (categories.length === 0) return null;

  return (
    <View style={styles.categoryGridSection}>
      <FlatList
        data={categories}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={styles.categoryGrid}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryItem}
            onPress={() => {
              trackEvent('category_open', {
                categoryId: item._id,
                screen: 'home',
              });
              navigateToCategory(item._id, item);
            }}
          >
            <View style={styles.categoryIconContainer}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryIcon}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.placeholderIcon, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                  <Ionicons name="grid-outline" size={24} color={colors.primary} />
                </View>
              )}
            </View>
            <Text style={[styles.categoryName, { color: colors.text.gray }]} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item, index) => `category-${item._id}-${index}`}
      />
    </View>
  );
});
CategoryGrid.displayName = "CategoryGrid";

const styles = StyleSheet.create({
  categoryGridSection: {
    marginTop: 25,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  accentBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { padding: 10, fontSize: 14, fontWeight: "bold", flex: 1, },
  categoryGrid: {
    gap: 16,
  },
  categoryItem: {
    flex: 1,
    alignItems: "center",
    maxWidth: "25%",
  },
  categoryIconContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  placeholderIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  categoryName: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "400",
  },
});
