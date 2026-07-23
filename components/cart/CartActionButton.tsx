/**
 * `CartActionButton` — the *presentation* half of add-to-cart.
 *
 * Purely visual: it knows nothing about carts, products, auth or networking.
 * It takes a `state` and an `onPress` and renders one unmistakable appearance
 * per state:
 *
 *   default      brand fill, cart glyph, "Add to cart"
 *   loading      brand fill dimmed, rotating ring, "Adding…", presses swallowed
 *   success      green fill, drawn checkmark, "Added"
 *   selectOptions muted fill, options glyph, "Select options" (still pressable,
 *                so the tap can explain what's missing — same as before)
 *   outOfStock   muted fill, slash glyph, "Out of stock"
 *   disabled     muted fill, label unchanged
 *
 * Colours come from `useCheckoutTheme()`, so light/dark are both covered and
 * there is not one hardcoded hex in the component.
 */

import React, { forwardRef, useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { radius, typography } from '@/theme/tokens';

import { ButtonSpinner } from './ButtonSpinner';
import { SuccessCheck } from './SuccessCheck';
import type { AddToCartVisualState } from './useAddToCart';
import { cartStrings as S } from './strings';
import { tapHaptic } from './haptics';

/** Keeps the Cairo font while letting Reanimated drive the label colour. */
const AnimatedText = Animated.createAnimatedComponent(Text);

/** Overdamped: the CTA settles on release instead of springing back. */
const PRESS_SPRING = { damping: 24, stiffness: 340, mass: 0.6 };

export type CartActionButtonSize = 'sm' | 'md' | 'lg';

export type CartActionButtonProps = {
  state: AddToCartVisualState;
  onPress: () => void;
  /** Overrides the default label for the `default` state only. */
  label?: string;
  size?: CartActionButtonSize;
  /** Merged over the computed container style (kept for existing call sites). */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityHint?: string;
  /** Extra line rendered under the label (e.g. price, dev disabled reason). */
  footnote?: string | null;
  testID?: string;
};

const SIZES: Record<
  CartActionButtonSize,
  { minHeight: number; paddingV: number; fontSize: number; icon: number; gap: number }
> = {
  sm: { minHeight: 40, paddingV: 9, fontSize: 14, icon: 16, gap: 6 },
  md: { minHeight: 48, paddingV: 12, fontSize: 15, icon: 18, gap: 8 },
  lg: { minHeight: 56, paddingV: 16, fontSize: 17, icon: 20, gap: 10 },
};

/**
 * Single animated driver for the whole button:
 *   0 = muted (disabled / out of stock / select options)
 *   1 = brand  (default / loading)
 *   2 = success
 * One shared value means one `withTiming` and zero colour "snaps".
 */
function phaseFor(state: AddToCartVisualState): number {
  if (state === 'success') return 2;
  if (state === 'default' || state === 'loading') return 1;
  return 0;
}

export const CartActionButton = React.memo(
  forwardRef<View, CartActionButtonProps>(function CartActionButton(
    {
      state,
      onPress,
      label,
      size = 'lg',
      style,
      textStyle,
      accessibilityHint,
      footnote,
      testID,
    },
    ref,
  ) {
    const t = useCheckoutTheme();
    const dims = SIZES[size];
    const reduceMotion = useReducedMotion();

    const phase = useSharedValue(phaseFor(state));
    const press = useSharedValue(1);

    const isBusy = state === 'loading';
    const isSuccess = state === 'success';
    // Only in-flight and just-succeeded presses are swallowed — the same rule
    // the original button had (`disabled={isLoading}`). An out-of-stock or
    // "select options" tap must still reach the handler, because that tap is
    // how the customer gets told *why* they can't add it.
    const isPressBlocked = isBusy || isSuccess;
    /** Semantically unavailable — announced to screen readers as disabled. */
    const isUnavailable = state === 'outOfStock' || state === 'disabled';

    useEffect(() => {
      const next = phaseFor(state);
      phase.value = reduceMotion
        ? next
        : withTiming(next, { duration: 260 });
    }, [state, phase, reduceMotion]);

    const containerStyle = useAnimatedStyle(() => ({
      backgroundColor: interpolateColor(
        phase.value,
        [0, 1, 2],
        [t.ctaDisabled, t.cta, t.success],
      ),
      transform: [{ scale: press.value }],
    }));

    const labelColorStyle = useAnimatedStyle(() => ({
      color: interpolateColor(
        phase.value,
        [0, 1, 2],
        [t.ctaDisabledText, t.ctaText, t.textInverse],
      ),
    }));

    const handlePressIn = () => {
      if (isPressBlocked) return;
      tapHaptic();
      press.value = reduceMotion
        ? 1
        : withSpring(0.975, PRESS_SPRING);
    };

    const handlePressOut = () => {
      press.value = withSpring(1, PRESS_SPRING);
    };

    const resolved = useMemo(() => {
      switch (state) {
        case 'loading':
          return { text: S.adding(), icon: null as null | keyof typeof Ionicons.glyphMap };
        case 'success':
          return { text: S.added(), icon: null };
        case 'outOfStock':
          return { text: S.outOfStock(), icon: 'close-circle-outline' as const };
        case 'selectOptions':
          return { text: S.selectOptions(), icon: 'options-outline' as const };
        case 'disabled':
          return { text: label ?? S.addToCart(), icon: 'bag-handle-outline' as const };
        default:
          return { text: label ?? S.addToCart(), icon: 'bag-handle-outline' as const };
      }
    }, [state, label]);

    // The icon colour has to be a concrete value (Ionicons is not animatable),
    // so it tracks the same three phases in JS. It only changes on state change.
    const glyphColor =
      state === 'success'
        ? t.textInverse
        : phaseFor(state) === 1
          ? t.ctaText
          : t.ctaDisabledText;

    return (
      <Animated.View
        style={[
          styles.container,
          { minHeight: dims.minHeight },
          containerStyle,
          style,
        ]}
      >
        <Pressable
          ref={ref}
          onPress={isPressBlocked ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isPressBlocked}
          // Padding lives on the Pressable so the whole visual area is tappable.
          style={[styles.pressable, { paddingVertical: dims.paddingV }]}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={resolved.text}
          accessibilityHint={accessibilityHint}
          accessibilityState={{
            disabled: isUnavailable,
            busy: isBusy,
          }}
        >
          <Animated.View
            style={[styles.row, { gap: dims.gap }]}
            layout={reduceMotion ? undefined : LinearTransition.duration(180)}
          >
            {isBusy ? (
              <Animated.View
                key="spinner"
                entering={reduceMotion ? undefined : FadeIn.duration(140)}
                exiting={reduceMotion ? undefined : FadeOut.duration(120)}
              >
                <ButtonSpinner size={dims.icon} color={t.ctaText} />
              </Animated.View>
            ) : isSuccess ? (
              <Animated.View
                key="check"
                entering={reduceMotion ? undefined : FadeIn.duration(120)}
                exiting={reduceMotion ? undefined : FadeOut.duration(120)}
              >
                <SuccessCheck
                  size={dims.icon + 2}
                  color={t.textInverse}
                  playKey={state}
                />
              </Animated.View>
            ) : resolved.icon ? (
              <Animated.View
                key={`glyph-${resolved.icon}`}
                entering={reduceMotion ? undefined : FadeIn.duration(140)}
                exiting={reduceMotion ? undefined : FadeOut.duration(100)}
              >
                <Ionicons name={resolved.icon} size={dims.icon} color={glyphColor} />
              </Animated.View>
            ) : null}

            <AnimatedText
              key={`label-${resolved.text}`}
              bold
              entering={reduceMotion ? undefined : FadeIn.duration(160)}
              numberOfLines={2}
              maxFontSizeMultiplier={1.6}
              style={[
                styles.label,
                { fontSize: dims.fontSize },
                labelColorStyle,
                textStyle,
              ]}
            >
              {resolved.text}
            </AnimatedText>
          </Animated.View>

          {footnote ? (
            <Text
              style={[styles.footnote, { color: glyphColor }]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
            >
              {footnote}
            </Text>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  }),
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footnote: {
    ...typography.label,
    marginTop: 2,
    opacity: 0.85,
  },
});
