import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { animation } from "@/theme/tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Scale factor while pressed. Defaults to a subtle 0.97. */
  scaleTo?: number;
  children?: React.ReactNode;
};

/**
 * A Pressable that gently scales down on press using Reanimated. Shared across
 * the app's interactive surfaces (profile, auth, …) so every touch reacts with
 * one consistent, subtle motion. Disabled Pressables don't fire press events,
 * so they never animate.
 */
export const PressableScale = forwardRef<
  React.ComponentRef<typeof Pressable>,
  PressableScaleProps
>(function PressableScale(
  { style, scaleTo = 0.97, onPressIn, onPressOut, children, ...rest },
  ref
) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      ref={ref}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: animation.fast });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: animation.base });
        onPressOut?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});
