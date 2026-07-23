/**
 * Animated checkmark used by the add-to-cart success state.
 *
 * The tick is *drawn* (stroke-dashoffset) rather than faded in, which reads as
 * a deliberate confirmation instead of a state flip. Everything runs on the UI
 * thread through Reanimated's `useAnimatedProps`, so it stays smooth while the
 * cart request settles and the list re-renders behind it.
 */

import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Length of the tick path in the 24×24 viewBox, rounded up. */
const PATH_LENGTH = 26;

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Bump to replay the draw without remounting. */
  playKey?: number | string;
};

export const SuccessCheck = React.memo(function SuccessCheck({
  size = 22,
  color = '#FFFFFF',
  strokeWidth = 2.6,
  playKey,
}: Props) {
  const draw = useSharedValue(0);
  const pop = useSharedValue(0.6);

  useEffect(() => {
    draw.value = 0;
    // Settles without overshoot — the confirmation reads as calm rather than
    // springy. The *drawing* of the tick carries the motion, not a bounce.
    pop.value = 0.88;
    pop.value = withSpring(1, { damping: 22, stiffness: 260, mass: 0.6 });
    draw.value = withDelay(
      60,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
  }, [playKey, draw, pop]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: PATH_LENGTH * (1 - draw.value),
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <Animated.View style={wrapStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <AnimatedPath
          d="M4.5 12.5 L9.8 17.8 L19.5 6.6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={PATH_LENGTH}
          animatedProps={pathProps}
        />
      </Svg>
    </Animated.View>
  );
});
