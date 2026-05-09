import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = PressableProps & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export const PressableScale = React.memo(function PressableScale({
  scaleTo = 0.97,
  style,
  children,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(
    (e: any) => {
      if (disabled) return;
      scale.value = withSpring(scaleTo, SPRING);
      opacity.value = withTiming(0.92, { duration: 80 });
      onPressIn?.(e);
    },
    [disabled, onPressIn, opacity, scale, scaleTo],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, SPRING);
      opacity.value = withTiming(1, { duration: 120 });
      onPressOut?.(e);
    },
    [onPressOut, opacity, scale],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});
