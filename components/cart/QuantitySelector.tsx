/**
 * `QuantitySelector` — the +/− control used everywhere a line quantity changes.
 *
 * What it fixes versus the previous stepper:
 *  • **Touch targets.** The glyphs were 32–36pt boxes with a 6pt hitSlop; the
 *    control is now ≥44pt (`MIN_TOUCH`) in both dimensions, which is the
 *    platform minimum and the difference between "hit it" and "hit it twice".
 *  • **Accidental taps.** A short cooldown after each tap plus a per-press
 *    spring means a double-tap can't fire two mutations in the same frame.
 *  • **Loading state.** The value used to be replaced by a spinner, so the
 *    number you were changing disappeared mid-change. Now the number stays and
 *    a subtle progress ring runs behind it.
 *  • **Motion.** The value rolls in the direction of the change, so + and −
 *    look different even in peripheral vision.
 *
 * It owns no quantity state: `value` in, `onIncrement`/`onDecrement` out. The
 * cart store remains the single source of truth.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { MIN_TOUCH, typography } from '@/theme/tokens';

import { ButtonSpinner } from './ButtonSpinner';
import { cartStrings as S } from './strings';
import { stepHaptic } from './haptics';

export type QuantitySelectorProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** A mutation for this line is in flight. */
  busy?: boolean;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  /** Fully disables both buttons (e.g. the whole cart is refreshing). */
  disabled?: boolean;
  testID?: string;
};

/** Swallow a second tap that lands within this window. */
const TAP_COOLDOWN_MS = 220;

const SPRING = { damping: 16, stiffness: 340, mass: 0.5 };

export const QuantitySelector = React.memo(function QuantitySelector({
  value,
  onIncrement,
  onDecrement,
  busy,
  min = 1,
  max,
  size = 'md',
  disabled,
  testID,
}: QuantitySelectorProps) {
  const t = useCheckoutTheme();
  const reduceMotion = useReducedMotion();

  const isMin = value <= min;
  const isMax = max != null && value >= max;
  const btn = size === 'sm' ? MIN_TOUCH : MIN_TOUCH + 4;

  const lastTapRef = useRef(0);
  const [roll, setRoll] = useState<{ key: number; dir: 1 | -1 }>({ key: 0, dir: 1 });
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current === value) return;
    const dir: 1 | -1 = value > prevValue.current ? 1 : -1;
    prevValue.current = value;
    setRoll(r => ({ key: r.key + 1, dir }));
  }, [value]);

  const guard = useCallback(
    (fn: () => void, blocked: boolean) => () => {
      if (blocked) return;
      const now = Date.now();
      if (now - lastTapRef.current < TAP_COOLDOWN_MS) return;
      lastTapRef.current = now;
      stepHaptic();
      fn();
    },
    [],
  );

  const decDisabled = !!busy || !!disabled || isMin;
  const incDisabled = !!busy || !!disabled || isMax;

  return (
    <View
      testID={testID}
      style={[
        styles.wrap,
        {
          borderColor: t.border,
          backgroundColor: t.surfaceMuted,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel={S.quantity()}
      accessibilityValue={{ now: value, text: String(value) }}
      accessibilityState={{ busy: !!busy, disabled: !!disabled }}
    >
      <StepButton
        dimension={btn}
        icon="remove"
        color={decDisabled ? t.textTertiary : t.textPrimary}
        disabled={decDisabled}
        onPress={guard(onDecrement, decDisabled)}
        label={S.decrease()}
        reduceMotion={reduceMotion}
      />

      <View style={[styles.valueWrap, { width: btn - 6 }]}>
        {busy ? (
          <View style={styles.spinnerLayer} pointerEvents="none">
            <ButtonSpinner size={size === 'sm' ? 22 : 26} width={1.6} color={t.accent} />
          </View>
        ) : null}
        <RollingValue
          key={roll.key}
          value={value}
          dir={roll.dir}
          color={t.textPrimary}
          animate={!reduceMotion}
        />
      </View>

      <StepButton
        dimension={btn}
        icon="add"
        color={incDisabled ? t.textTertiary : t.textPrimary}
        disabled={incDisabled}
        onPress={guard(onIncrement, incDisabled)}
        label={S.increase()}
        reduceMotion={reduceMotion}
      />
    </View>
  );
});

const StepButton = React.memo(function StepButton({
  dimension,
  icon,
  color,
  disabled,
  onPress,
  label,
  reduceMotion,
}: {
  dimension: number;
  icon: 'add' | 'remove';
  color: string;
  disabled: boolean;
  onPress: () => void;
  label: string;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (disabled || reduceMotion) return;
        scale.value = withSpring(0.86, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.btn, { width: dimension, height: dimension }]}
    >
      <Animated.View style={style}>
        <Ionicons name={icon} size={20} color={color} />
      </Animated.View>
    </Pressable>
  );
});

const RollingValue = React.memo(function RollingValue({
  value,
  dir,
  color,
  animate,
}: {
  value: number;
  dir: 1 | -1;
  color: string;
  animate: boolean;
}) {
  const y = useSharedValue(animate ? dir * 12 : 0);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    y.value = withSpring(0, SPRING);
    opacity.value = withTiming(1, { duration: 130 });
  }, [y, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={style}>
      <Text
        style={[styles.valueText, { color }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {value}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 2,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  valueWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 30,
  },
  spinnerLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { ...typography.bodyStrong },
});
