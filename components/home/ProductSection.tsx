import React, { memo, useCallback } from "react";
import { View, FlatList, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import ItemCard from "@/components/Card";
import ItemCardSkeleton from "@/components/ItemCardSkeleton";
import { HomeProduct } from "@/api/home.api";
import { FlashDealsCountdown } from "./FlashDealsCountdown";
import i18n from "@/utils/i18n";

export interface ProductSectionProps {
  title: string;
  products: HomeProduct[];
  colors: any;
  isLoading?: boolean;
  onViewAll?: () => void;
  showCountdown?: boolean;
}

export const ProductSection = memo(({
  title,
  products,
  colors,
  isLoading = false,
  onViewAll,
  showCountdown = false,
}: ProductSectionProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth * 0.45;
  const itemWidth = cardWidth + 12; 

  // Products are already normalized at the API boundary (home.api.ts /
  // recommendations.api.ts). No client-side re-normalization here — that path
  // used to silently re-introduce the price-alias confusion.
  const renderItem = useCallback(({ item }: { item: HomeProduct }) => (
    <View style={{ width: cardWidth, marginRight: 12 }}>
      <ItemCard
        item={item}
        cardWidth={cardWidth}
      />
    </View>
  ), [cardWidth]);

  const keyExtractor = useCallback((item: HomeProduct, index: number) =>
    `${title}-${item.id}-${index}`, [title]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index,
  }), [itemWidth]);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
            {title}
          </Text>
        </View>
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => (
            <View style={{ width: cardWidth, marginRight: 12 }}>
              <ItemCardSkeleton />
            </View>
          )}
          keyExtractor={(_, index) => `${title}-skeleton-${index}`}
        />
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
          {title}
        </Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>{i18n.t("home_seeAll")}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {showCountdown && <FlashDealsCountdown colors={colors} />}
      <FlatList
        horizontal
        data={products}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={3}
        initialNumToRender={3}
      />
    </View>
  );
});
ProductSection.displayName = "ProductSection";

const styles = StyleSheet.create({
  section: { marginTop: 25 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    textAlign: "center",
  },
  accentBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { padding: 10, fontSize: 14, fontWeight: "bold", flex: 1, },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    padding: 5,
    fontSize: 12,
    fontWeight: "600",
  },
});
