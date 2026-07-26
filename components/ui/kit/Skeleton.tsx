import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radius, spacing } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

const PULSE_MS = 850;

/**
 * A single shimmering placeholder block.
 *
 * Opacity-pulses rather than sliding a gradient: it costs one animated value on
 * the UI thread, so a screen can show twenty of them during a cold load without
 * dropping frames. Hidden from assistive tech — a screen reader should hear
 * "loading" once from the container, not twenty empty views.
 */
export const SkeletonBlock = React.memo(function SkeletonBlock({
  width = '100%',
  height = 14,
  rounded = radius.xs,
  style,
}: SkeletonBlockProps) {
  const colors = useColors();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: rounded,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

/**
 * Product card placeholder.
 *
 * Mirrors the real card's geometry exactly — square image well, two title
 * lines, one price line — so content doesn't jump when it lands. A skeleton
 * that doesn't match its component is worse than a spinner.
 */
export const SkeletonProductCard = React.memo(function SkeletonProductCard({
  width,
  style,
}: {
  width?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { width, backgroundColor: colors.cardBackground },
        style,
      ]}
      accessibilityLabel="Loading product"
    >
      {/* Square well, sized by aspect ratio so it matches the real card
          regardless of column width. */}
      <SkeletonBlock rounded={radius.none} style={styles.imageWell} />
      <View style={styles.cardBody}>
        <SkeletonBlock height={13} width="92%" />
        <SkeletonBlock height={13} width="64%" />
        <SkeletonBlock height={18} width="45%" style={styles.cardPrice} />
      </View>
    </View>
  );
});

/** Placeholder for a horizontal list row (cart line, order line, address). */
export const SkeletonListRow = React.memo(function SkeletonListRow({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, style]} accessibilityLabel="Loading">
      <SkeletonBlock width={84} height={84} rounded={radius.image} />
      <View style={styles.rowBody}>
        <SkeletonBlock height={14} width="80%" />
        <SkeletonBlock height={12} width="45%" />
        <SkeletonBlock height={18} width="35%" style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
});

/** Placeholder for a section header + horizontal rail. */
export const SkeletonRail = React.memo(function SkeletonRail({
  cardWidth,
  count = 3,
}: {
  cardWidth: number;
  count?: number;
}) {
  return (
    <View style={styles.rail} accessibilityLabel="Loading section">
      <View style={styles.railHeader}>
        <SkeletonBlock height={20} width={160} rounded={radius.xs} />
        <SkeletonBlock height={28} width={72} rounded={radius.pill} />
      </View>
      <View style={styles.railRow}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonProductCard key={i} width={cardWidth} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    // No `overflow: hidden` here — it would clip the iOS shadow a caller
    // passes in via `style`. The well rounds its own top corners instead.
  },
  // `aspectRatio` wins over the block's default height, giving a square well.
  imageWell: {
    width: '100%',
    height: 'auto',
    aspectRatio: 1,
    borderTopStartRadius: radius.card,
    borderTopEndRadius: radius.card,
  },
  cardBody: { padding: spacing.md, gap: spacing.sm },
  cardPrice: { marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  rowBody: { flex: 1, gap: spacing.sm, paddingTop: spacing.xs },
  rail: { gap: spacing.md, paddingVertical: spacing.md },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  railRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base },
});
