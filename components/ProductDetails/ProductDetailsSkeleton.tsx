import { useEffect, memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LightColors, DarkColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

const ShimmerBox = memo(
  ({
    width,
    height,
    borderRadius = 8,
    shimmerColor,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    shimmerColor: string;
    style?: object;
  }) => {
    const opacity = useSharedValue(0.4);

    useEffect(() => {
      opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true);
    }, []);

    const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
      <Animated.View
        style={[
          { width: width as any, height, borderRadius, backgroundColor: shimmerColor },
          animStyle,
          style,
        ]}
      />
    );
  }
);
ShimmerBox.displayName = 'ShimmerBox';

export const ProductDetailsSkeleton = memo(({ colors }: { colors: LightColors | DarkColors }) => {
  const insets = useSafeAreaInsets();
  const shimmer = colors.borderLight;
  const shimmerStrong = colors.borderMedium;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {/* Image area */}
      <ShimmerBox
        width={SCREEN_WIDTH}
        height={IMAGE_HEIGHT}
        borderRadius={0}
        shimmerColor={colors.surface}
      />

      {/* Overlay back/wishlist button skeletons */}
      <View style={[styles.overlayButtons, { top: insets.top + 8 }]}>
        <View style={[styles.skeletonButton, { backgroundColor: colors.cardBackground + 'CC' }]} />
        <View style={[styles.skeletonButton, { backgroundColor: colors.cardBackground + 'CC' }]} />
      </View>

      {/* Pagination dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: i === 0 ? 20 : 6,
                backgroundColor: i === 0
                  ? colors.text.gray + '55'
                  : colors.text.gray + '25',
              },
            ]}
          />
        ))}
      </View>

      {/* Info section */}
      <View style={[styles.infoSection, { backgroundColor: colors.cardBackground }]}>
        <ShimmerBox width={80} height={12} borderRadius={6} shimmerColor={shimmer} style={{ marginBottom: 12 }} />
        <ShimmerBox width="85%" height={26} borderRadius={6} shimmerColor={shimmerStrong} style={{ marginBottom: 6 }} />
        <ShimmerBox width="55%" height={22} borderRadius={6} shimmerColor={shimmerStrong} style={{ marginBottom: 20 }} />

        <View style={styles.priceRow}>
          <ShimmerBox width={130} height={32} borderRadius={8} shimmerColor={colors.primary + '30'} />
          <ShimmerBox width={60} height={20} borderRadius={6} shimmerColor={shimmer} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        {/* Attribute pills */}
        <ShimmerBox width={56} height={12} borderRadius={6} shimmerColor={shimmer} style={{ marginBottom: 12 }} />
        <View style={styles.pillsRow}>
          {[70, 55, 65, 52].map((w, i) => (
            <ShimmerBox key={i} width={w} height={42} borderRadius={100} shimmerColor={shimmerStrong} />
          ))}
        </View>

        <ShimmerBox width={56} height={12} borderRadius={6} shimmerColor={shimmer} style={{ marginBottom: 12, marginTop: 20 }} />
        <View style={styles.pillsRow}>
          {[42, 42, 42].map((_, i) => (
            <ShimmerBox key={i} width={42} height={42} borderRadius={21} shimmerColor={shimmerStrong} />
          ))}
        </View>
      </View>

      {/* Sticky CTA skeleton */}
      <View
        style={[
          styles.ctaArea,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.surface + 'F0',
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <ShimmerBox
          width="100%"
          height={54}
          borderRadius={30}
          shimmerColor={colors.primary + '50'}
        />
      </View>
    </View>
  );
});
ProductDetailsSkeleton.displayName = 'ProductDetailsSkeleton';

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlayButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  skeletonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dots: {
    position: 'absolute',
    top: IMAGE_HEIGHT - 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  infoSection: {
    padding: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ctaArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
