import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useCheckoutTheme, withAlpha } from './theme';
import { radius } from './tokens';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const Skeleton = React.memo(function Skeleton({
  width = '100%',
  height = 14,
  borderRadius = 8,
  style,
}: Props) {
  const t = useCheckoutTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: withAlpha(t.isDark ? '#FFFFFF' : '#000000', 0.06),
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

export const SkeletonCartRow = React.memo(function SkeletonCartRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={88} height={88} borderRadius={radius.input} />
      <View style={styles.rowBody}>
        <Skeleton width="80%" height={14} />
        <View style={{ height: 8 }} />
        <Skeleton width="40%" height={12} />
        <View style={{ height: 16 }} />
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  rowBody: { flex: 1, paddingTop: 4 },
});
