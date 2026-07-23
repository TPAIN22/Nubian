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
import { spacing } from '@/theme/tokens';

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
}

/**
 * Sticky purchase bar.
 *
 * Presentation only — the CTA's behaviour lives in `useAddToCart`. Haptics are
 * no longer fired here: the button plays the press tick and the hook plays the
 * commit / success / blocked feedback, so a single tap used to produce two
 * overlapping vibrations.
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
  }: ProductActionsProps) => {
    const insets = useSafeAreaInsets();

    const content = (
      <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {stockLevel && stockLevel !== 'unknown' ? (
          <StockIndicator
            level={stockLevel}
            stock={stock}
            variant="pill"
            style={styles.stock}
          />
        ) : null}

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
    );

    if (Platform.OS === 'ios') {
      return (
        <Animated.View entering={FadeInDown.duration(280)} style={styles.container}>
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
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  inner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  stock: { marginBottom: 2 },
  cartButton: {
    borderRadius: 30,
  },
});
