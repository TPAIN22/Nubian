import { StyleSheet, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { memo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AddToCartButton from '../AddToCartButton';
import { StockIndicator } from '../cart/StockIndicator';
import type { StockLevel } from '../cart/useAddToCart';
import type { SelectedAttributes } from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import type { LightColors, DarkColors } from '@/theme';
import { AppText, Price } from '@/components/ui/kit';
import { elevationUp, radius, spacing } from '@/theme/tokens';
import i18n from '@/utils/i18n';

interface ProductActionsProps {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  isAvailable: boolean;
  themeColors: LightColors | DarkColors;
  onAttempt?: () => void;
  /** Image used by the fly-to-cart animation (the variant image when picked). */
  imageUri?: string | null;
  /** Rendered above the CTA so stock is visible without scrolling back up. */
  stockLevel?: StockLevel;
  stock?: number | null;
  /** Pre-formatted current price. Shown beside the CTA when provided. */
  priceLabel?: string;
  /** Pre-formatted was-price. Only meaningful alongside `priceLabel`. */
  originalPriceLabel?: string | null;
}

/**
 * Sticky purchase bar.
 *
 * Presentation only — the CTA's behaviour lives in `useAddToCart`. Haptics are
 * no longer fired here: the button plays the press tick and the hook plays the
 * commit / success / blocked feedback, so a single tap used to produce two
 * overlapping vibrations.
 *
 * The bar now carries the price beside the button. Once the customer scrolls
 * past the info block the price left the screen entirely, so the final tap
 * happened without the amount in view — the pattern every major commerce app
 * (Noon, Amazon, Talabat) avoids by pinning price and CTA together.
 */
export const ProductActions = memo(
  ({
    product,
    selectedAttributes,
    isAvailable,
    themeColors,
    onAttempt,
    imageUri,
    stockLevel,
    stock,
    priceLabel,
    originalPriceLabel,
  }: ProductActionsProps) => {
    const insets = useSafeAreaInsets();
    const showPrice = Boolean(priceLabel);

    const content = (
      <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
        {stockLevel && stockLevel !== 'unknown' ? (
          <StockIndicator
            level={stockLevel}
            stock={stock}
            variant="pill"
            style={styles.stock}
          />
        ) : null}

        <View style={styles.row}>
          {showPrice ? (
            <View style={styles.priceBlock}>
              <AppText variant="micro" tone="muted" numberOfLines={1}>
                {i18n.t('total') || 'Total'}
              </AppText>
              <Price
                value={priceLabel!}
                original={originalPriceLabel ?? null}
                size="sm"
                stacked
              />
            </View>
          ) : null}

          <View style={showPrice ? styles.ctaWrap : styles.ctaWrapFull}>
            <AddToCartButton
              product={product}
              selectedAttributes={selectedAttributes}
              buttonStyle={styles.cartButton}
              disabled={!isAvailable}
              onPressAttempt={onAttempt}
              imageUri={imageUri}
              size="lg"
            />
          </View>
        </View>
      </View>
    );

    if (Platform.OS === 'ios') {
      return (
        <Animated.View entering={FadeInDown.duration(280)} style={[styles.container, elevationUp]}>
          <BlurView intensity={85} tint="systemChromeMaterial" style={StyleSheet.absoluteFill} />
          {content}
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeInDown.duration(280)}
        style={[
          styles.container,
          {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.borderLight,
          },
          elevationUp,
        ]}
      >
        {content}
      </Animated.View>
    );
  }
);
ProductActions.displayName = 'ProductActions';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopStartRadius: radius.sheet,
    borderTopEndRadius: radius.sheet,
    overflow: 'hidden',
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  stock: { marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  // The price never squeezes the CTA below a comfortable tap width: it sizes to
  // its content and the button takes everything that's left.
  priceBlock: { flexShrink: 1 },
  ctaWrap: { flex: 1, minWidth: 150 },
  ctaWrapFull: { flex: 1 },
  cartButton: {
    borderRadius: radius.button,
  },
});
