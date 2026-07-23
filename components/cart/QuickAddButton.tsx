/**
 * `QuickAddButton` — the compact add-to-cart affordance for product cards.
 *
 * Runs on the exact same `useAddToCart` hook as the product-details CTA, so the
 * validation, auth gate, mutation, analytics and error handling are identical —
 * a card add and a details add can no longer behave differently.
 *
 * The one card-specific rule: when the product needs an attribute choice the
 * card cannot make (size, colour, …), the button *navigates to the details
 * screen* instead of failing. That is `onNeedsSelection`; it invents no
 * validation of its own, it just picks the sensible destination for a
 * selection the surface can't offer.
 *
 * Not enabled by default — `ProductCard` renders it only when
 * `showQuickAdd` is passed, so existing card layouts are untouched until the
 * behaviour is deliberately turned on.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useCheckoutTheme } from '@/components/checkout/theme';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import { navigateToProduct } from '@/utils/deepLinks';
import { MIN_TOUCH } from '@/theme/tokens';

import { ButtonSpinner } from './ButtonSpinner';
import { SuccessCheck } from './SuccessCheck';
import { useAddToCart } from './useAddToCart';
import { cartStrings as S } from './strings';
import { tapHaptic } from './haptics';

type Props = {
  product: NormalizedProduct;
  /** Image used by the fly-to-cart animation. Defaults to the first image. */
  imageUri?: string | null;
  size?: number;
  /** Analytics screen dimension. */
  screen?: string;
};

const SPRING = { damping: 22, stiffness: 340, mass: 0.5 };
/** Press-down scale. Shallow enough to read as a press, not a bounce. */
const PRESS_SCALE = 0.94;

export const QuickAddButton = React.memo(function QuickAddButton({
  product,
  imageUri,
  size = MIN_TOUCH,
  screen = 'product_card',
}: Props) {
  const t = useCheckoutTheme();
  const reduceMotion = useReducedMotion();
  const sourceRef = useRef<View | null>(null);
  const scale = useSharedValue(1);

  const goToDetails = useCallback(() => {
    if (!product?.id) return;
    navigateToProduct(product.id, product as any);
  }, [product]);

  const { visualState, addToCart, stockLevel } = useAddToCart({
    product,
    screen,
    sourceRef,
    imageUri,
    onNeedsSelection: goToDetails,
  });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isBusy = visualState === 'loading';
  const isSuccess = visualState === 'success';
  const isOut = stockLevel === 'outOfStock' || visualState === 'outOfStock';

  const bg = isSuccess ? t.success : isOut ? t.ctaDisabled : t.cta;
  const fg = isSuccess ? t.textInverse : isOut ? t.ctaDisabledText : t.ctaText;

  const label = isOut
    ? S.outOfStock()
    : isSuccess
      ? S.added()
      : S.addToCart();

  return (
    <Animated.View
      ref={sourceRef as any}
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: t.border,
        },
        animStyle,
      ]}
    >
      <Pressable
        // Out-of-stock still reaches the handler so the customer gets told why
        // — same reasoning as the full-width CTA.
        onPress={isBusy || isSuccess ? undefined : addToCart}
        onPressIn={() => {
          if (isBusy || reduceMotion) return;
          tapHaptic();
          scale.value = withSpring(PRESS_SCALE, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        disabled={isBusy || isSuccess}
        hitSlop={6}
        style={styles.press}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isOut, busy: isBusy }}
      >
        {isBusy ? (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(120)}>
            <ButtonSpinner size={18} color={fg} width={2} />
          </Animated.View>
        ) : isSuccess ? (
          <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(120)}>
            <SuccessCheck size={20} color={fg} playKey={visualState} />
          </Animated.View>
        ) : (
          <Animated.View
            entering={reduceMotion ? undefined : FadeIn.duration(140)}
            exiting={reduceMotion ? undefined : FadeOut.duration(100)}
          >
            <Ionicons
              name={isOut ? 'close' : 'add'}
              size={22}
              color={fg}
            />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  press: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
