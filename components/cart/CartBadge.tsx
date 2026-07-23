/**
 * `CartBadge` — animated cart count.
 *
 * Behaviour it guarantees:
 *  • the count never *jumps* — it rolls (old digit slides out, new slides in)
 *    in the direction of the change, so +1 and −1 read differently;
 *  • the pill springs on every change and pops harder when a fly-to-cart
 *    animation lands (`subscribeBump`), so image and badge feel connected;
 *  • rapid additions collapse gracefully — each change retargets the same two
 *    shared values instead of queueing, so ten taps in a second never leave the
 *    badge mid-animation or showing a stale number;
 *  • 0 → 1 grows in from nothing and 1 → 0 shrinks away, instead of appearing
 *    and disappearing abruptly.
 *
 * It reads the count through the existing `useCartQuantity` selector, so it
 * re-renders only when the quantity itself changes.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
// Relative, not `@/store/useCartStore`: `types.d.ts` declares an ambient
// `@/store/useCartStore` module that only exposes a default export, so the
// alias hides every named selector. The rest of the app works around it the
// same way (see the previous import in `app/(tabs)/_layout.tsx`).
import { useCartQuantity } from '../../store/useCartStore';

import { subscribeBump } from './cartFeedback';

type Props = {
  /** Pill background. */
  color: string;
  /** Ring drawn against the tab bar so the pill reads on any icon. */
  borderColor: string;
  textColor?: string;
  /** Override the store value (tests / storybook). */
  count?: number;
  size?: number;
};

/**
 * Near-critically damped: the badge settles in one motion instead of wobbling.
 * Raise `damping` further to remove the last trace of overshoot, lower it for
 * a springier feel.
 */
const SPRING = { damping: 20, stiffness: 300, mass: 0.55 };

/** Peak scale of the count-changed pop, and of the flight-arrival pulse. */
const POP_SCALE = 1.1;
const ARRIVAL_POP_SCALE = 1.14;

export const CartBadge = React.memo(function CartBadge({
  color,
  borderColor,
  textColor = '#FFFFFF',
  count: countProp,
  size = 18,
}: Props) {
  const storeCount = useCartQuantity();
  const count = countProp ?? storeCount;
  const reduceMotion = useReducedMotion();

  const visible = count > 0;
  // Hold the last real number while the badge shrinks away, so the exit
  // animation never flashes a "0".
  const lastLabelRef = useRef('1');
  if (visible) lastLabelRef.current = count > 99 ? '99+' : String(count);
  const label = lastLabelRef.current;

  const scale = useSharedValue(visible ? 1 : 0);
  const pop = useSharedValue(1);
  const prevCount = useRef(count);

  // Direction of the roll: +1 when the count grew, −1 when it shrank.
  const [roll, setRoll] = useState<{ key: number; dir: 1 | -1 }>({
    key: 0,
    dir: 1,
  });

  useEffect(() => {
    const prev = prevCount.current;
    if (prev === count) return;
    prevCount.current = count;

    setRoll(r => ({ key: r.key + 1, dir: count > prev ? 1 : -1 }));

    if (reduceMotion) {
      scale.value = visible ? 1 : 0;
      return;
    }

    scale.value = withSpring(visible ? 1 : 0, SPRING);
    if (visible) {
      // Retargeting the same value means rapid taps blend instead of queueing.
      pop.value = withSequence(
        withTiming(POP_SCALE, { duration: 120 }),
        withTiming(1, { duration: 160 }),
      );
    }
  }, [count, visible, reduceMotion, scale, pop]);

  // A landing product image pops the badge in sync with its arrival.
  useEffect(() => {
    if (reduceMotion) return undefined;
    return subscribeBump(() => {
      pop.value = withSequence(
        withTiming(ARRIVAL_POP_SCALE, { duration: 130 }),
        withTiming(1, { duration: 180 }),
      );
    });
  }, [pop, reduceMotion]);

  // Stay mounted through the shrink-out so 1 → 0 animates instead of vanishing.
  const [rendered, setRendered] = useState(visible);
  useEffect(() => {
    if (visible) {
      setRendered(true);
      return undefined;
    }
    const timer = setTimeout(() => setRendered(false), reduceMotion ? 0 : 260);
    return () => clearTimeout(timer);
  }, [visible, reduceMotion]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: scale.value,
    transform: [{ scale: scale.value * pop.value }],
  }));

  if (!rendered) return null;

  const offset = reduceMotion ? 0 : roll.dir * 10;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.badge,
        {
          minWidth: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor,
        },
        wrapStyle,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${count}`}
    >
      {/* Absolute layers so the digit swap never nudges the pill's width mid-roll. */}
      <View style={styles.textWrap}>
        <RollingLabel
          key={roll.key}
          label={label}
          fromY={offset}
          animate={!reduceMotion}
          color={textColor}
        />
      </View>
    </Animated.View>
  );
});

const RollingLabel = React.memo(function RollingLabel({
  label,
  fromY,
  animate,
  color,
}: {
  label: string;
  fromY: number;
  animate: boolean;
  color: string;
}) {
  const y = useSharedValue(animate ? fromY : 0);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    y.value = withSpring(0, SPRING);
    opacity.value = withTiming(1, { duration: 140 });
  }, [y, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text
        style={[styles.text, { color }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  textWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
  },
});
