import { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, useWindowDimensions } from "react-native";
import ItemCard from "@/components/Card";
import { HomeProduct } from "@/api/home.api";
import { FlashDealsCountdown } from "./FlashDealsCountdown";
import { SectionHeader, SkeletonProductCard } from "@/components/ui/kit";
import { SCREEN_PADDING, spacing } from "@/theme/tokens";
import i18n from "@/utils/i18n";

export interface ProductSectionProps {
  title: string;
  products: HomeProduct[];
  colors: any;
  isLoading?: boolean;
  onViewAll?: () => void;
  showCountdown?: boolean;
  /** Trailing emoji rendered after the title (🔥, ⚡). */
  emoji?: string;
  /** One line of context under the title. */
  subtitle?: string;
}

/**
 * A horizontally scrolling product rail with a section header.
 *
 * Layout notes:
 *  - Cards are 46% of the screen so the next card is always ~half visible at
 *    the trailing edge. That peek is what tells the customer the row scrolls;
 *    without it a rail reads as a static pair of cards.
 *  - `snapToInterval` lands each swipe on a card boundary, so flicking through
 *    a rail feels deliberate rather than loose.
 *  - `contentContainerStyle` carries the gutter and `ItemSeparatorComponent`
 *    carries the gap, so the first and last cards align to the screen margin
 *    exactly like the section title above them.
 */
export const ProductSection = memo(({
  title,
  products,
  colors,
  isLoading = false,
  onViewAll,
  showCountdown = false,
  emoji,
  subtitle,
}: ProductSectionProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * 0.46);
  const itemWidth = cardWidth + spacing.md;

  // Products are already normalized at the API boundary (home.api.ts /
  // recommendations.api.ts). No client-side re-normalization here — that path
  // used to silently re-introduce the price-alias confusion.
  const renderItem = useCallback(({ item }: { item: HomeProduct }) => (
    <View style={{ width: cardWidth }}>
      <ItemCard item={item} cardWidth={cardWidth} />
    </View>
  ), [cardWidth]);

  const keyExtractor = useCallback((item: HomeProduct, index: number) =>
    `${title}-${item.id}-${index}`, [title]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: itemWidth,
    offset: itemWidth * index,
    index,
  }), [itemWidth]);

  const renderSeparator = useCallback(() => <View style={styles.gap} />, []);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <SectionHeader title={title} subtitle={subtitle} emoji={emoji} />
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <SkeletonProductCard key={i} width={cardWidth} />
          ))}
        </View>
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        emoji={emoji}
        onActionPress={onViewAll}
        actionLabel={i18n.t("home_seeAll")}
      />

      {showCountdown && <FlashDealsCountdown colors={colors} />}

      <FlatList
        horizontal
        data={products}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        ItemSeparatorComponent={renderSeparator}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        snapToAlignment="start"
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
  // 32pt between sections — the single change that does the most to stop the
  // feed feeling cramped.
  section: { marginTop: spacing.xxl },
  railContent: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.xs },
  gap: { width: spacing.md },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: SCREEN_PADDING,
  },
});
