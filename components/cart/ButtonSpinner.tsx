/**
 * Indeterminate spinner for buttons.
 *
 * A rotating gapped ring driven entirely by a Reanimated shared value, so it
 * keeps spinning at 60fps even while JS is busy parsing the cart response —
 * which is exactly when `ActivityIndicator` (a JS-driven native view on
 * Android) visibly stutters.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size?: number;
  color?: string;
  /** Thickness of the ring. */
  width?: number;
  /** Colour of the "empty" part of the track. Defaults to transparent. */
  trackColor?: string;
};

export const ButtonSpinner = React.memo(function ButtonSpinner({
  size = 20,
  color = '#FFFFFF',
  width = 2.2,
  trackColor = 'transparent',
}: Props) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = 0;
    spin.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, [spin]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: size / 2,
            borderWidth: width,
            borderColor: trackColor,
            borderTopColor: color,
            borderRightColor: color,
          },
          style,
        ]}
      />
    </View>
  );
});
