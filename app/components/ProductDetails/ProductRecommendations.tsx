import { View, StyleSheet, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { memo } from 'react';
import { HomeProduct } from '@/api/recommendations.api';
import ItemCard from '../Card';
import ItemCardSkeleton from '../ItemCardSkeleton';
import { navigateToProduct } from '@/utils/deepLinks';
import useTracking from '@/hooks/useTracking';
import i18n from '@/utils/i18n';
import { PRODUCT_DETAILS_CONFIG } from '@/constants/productDetails';
import type { LightColors, DarkColors } from '@/theme';

const { CARD_WIDTH } = PRODUCT_DETAILS_CONFIG;

interface RecommendationSectionProps {
  title: string;
  products: HomeProduct[];
  colors: LightColors | DarkColors;
  isLoading?: boolean;
}

const RecommendationSection = memo(({ 
  title, 
  products, 
  colors, 
  isLoading = false,
}: RecommendationSectionProps) => {
  const { trackEvent } = useTracking();
  
  if (isLoading) {
    return (
      <View style={recommendationStyles.section}>
        <View style={recommendationStyles.sectionHeader}>
          <View style={[recommendationStyles.accentBar, { backgroundColor: colors.primary }]} />
          <Text style={[recommendationStyles.sectionTitle, { color: colors.text.gray }]}>
            {title}
          </Text>
        </View>
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={() => (
            <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
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
    <View style={recommendationStyles.section}>
      <View style={recommendationStyles.sectionHeader}>
        <View style={[recommendationStyles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[recommendationStyles.sectionTitle, { color: colors.text.gray }]}>
          {title}
        </Text>
      </View>
      <FlatList
        horizontal
        data={products}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, marginRight: 12 }}>
            <ItemCard
              item={item}
              handleSheetChanges={() => {}}
              handlePresentModalPress={() => {
                trackEvent('recommendation_click', {
                  productId: item._id,
                  screen: 'product_details',
                });
                navigateToProduct(item._id, item);
              }}
            />
          </View>
        )}
        keyExtractor={(item, index) => `${title}-${item._id}-${index}`}
      />
    </View>
  );
});

RecommendationSection.displayName = 'RecommendationSection';

interface ProductRecommendationsProps {
  recommendations: {
    similarItems?: HomeProduct[];
    frequentlyBoughtTogether?: HomeProduct[];
    youMayAlsoLike?: HomeProduct[];
    cheaperAlternatives?: HomeProduct[];
    fromSameStore?: HomeProduct[];
  } | null;
  isLoading: boolean;
  colors: LightColors | DarkColors;
}

const RECOMMENDATION_SECTIONS = [
  { key: 'similarItems' as const, titleKey: 'similarItems' },
  { key: 'frequentlyBoughtTogether' as const, titleKey: 'frequentlyBoughtTogether' },
  { key: 'youMayAlsoLike' as const, titleKey: 'youMayAlsoLike' },
  { key: 'cheaperAlternatives' as const, titleKey: 'cheaperAlternatives' },
  { key: 'fromSameStore' as const, titleKey: 'fromSameStore' },
] as const;

export const ProductRecommendations = ({ recommendations, isLoading, colors }: ProductRecommendationsProps) => {
  if (!recommendations) return null;

  return (
    <>
      {RECOMMENDATION_SECTIONS.map(({ key, titleKey }) => {
        const products = recommendations[key];
        if (!products || products.length === 0) return null;

        return (
          <RecommendationSection
            key={key}
            title={i18n.t(titleKey) || titleKey}
            products={products}
            colors={colors}
            isLoading={isLoading}
          />
        );
      })}
    </>
  );
};

const recommendationStyles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
