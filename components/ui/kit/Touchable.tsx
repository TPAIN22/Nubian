import React, { forwardRef, useCallback } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { pressScale, pressSpring } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TouchableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /**
   * How far to shrink on press-in. Use the semantic presets rather than a
   * hand-picked number so a card and a button never disagree on feel.
   */
  scaleTo?: number;
  /** Dim slightly while held. Useful on image-backed surfaces. */
  dim?: boolean;
  children?: React.ReactNode;
}

/**
 * The app's standard press surface: an overdamped spring scale that settles
 * without bouncing, driven entirely on the UI thread.
 *
 * Everything tappable that isn't a `Button` should use this — cards, category
 * bubbles, banners, list rows — so that "the whole app reacts to touch the same
 * way" rather than some surfaces feeling dead.
 */
export const Touchable = forwardRef<
  React.ComponentRef<typeof Pressable>,
  TouchableProps
>(function Touchable(
  { style, scaleTo = pressScale.card, dim = false, onPressIn, onPressOut, children, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      scale.value = withSpring(scaleTo, pressSpring);
      if (dim) opacity.value = withSpring(0.85, pressSpring);
      onPressIn?.(e);
    },
    [scale, opacity, scaleTo, dim, onPressIn],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      scale.value = withSpring(1, pressSpring);
      if (dim) opacity.value = withSpring(1, pressSpring);
      onPressOut?.(e);
    },
    [scale, opacity, dim, onPressOut],
  );

  return (
    <AnimatedPressable
      ref={ref}
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
