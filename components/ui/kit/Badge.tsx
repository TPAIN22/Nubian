import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './Text';
import { iconSize, radius, spacing, withAlpha } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'sale';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** `soft` tints the background; `solid` fills it. */
  variant?: 'soft' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small status pill: stock state, order status, "New", "Free delivery".
 *
 * `soft` is the default because a grid of solid badges is visual noise — solid
 * is reserved for the one thing on a card that must win attention (a discount).
 */
export const Badge = React.memo(function Badge({
  label,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
  style,
}: BadgeProps) {
  const colors = useColors();

  const { base, contrast } = useMemo(() => {
    switch (tone) {
      case 'primary':
        return { base: colors.primary, contrast: colors.onPrimary };
      case 'success':
        return { base: colors.success, contrast: colors.text.inverse };
      case 'warning':
        return { base: colors.warning, contrast: colors.text.inverse };
      case 'error':
        return { base: colors.error, contrast: colors.text.inverse };
      case 'info':
        return { base: colors.info, contrast: colors.text.inverse };
      case 'sale':
        return { base: colors.sale, contrast: colors.text.inverse };
      case 'neutral':
      default:
        return { base: colors.text.muted, contrast: colors.text.inverse };
    }
  }, [tone, colors]);

  const solid = variant === 'solid';
  const outline = variant === 'outline';
  const fg = solid ? contrast : base;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: solid ? base : outline ? 'transparent' : withAlpha(base, 0.12),
          borderWidth: outline ? 1 : 0,
          borderColor: base,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={iconSize.xs} color={fg} /> : null}
      <AppText
        variant={size === 'sm' ? 'micro' : 'label'}
        weight="700"
        numberOfLines={1}
        style={{ color: fg }}
      >
        {label}
      </AppText>
    </View>
  );
});

/**
 * The discount flag on a product card.
 *
 * Deliberately the loudest element in the image well: a solid sale-red pill in
 * the top-start corner. It is not the brand gold, because gold is the CTA
 * colour — a discount competing with the buy button dilutes both.
 */
export const DiscountBadge = React.memo(function DiscountBadge({
  percentage,
  style,
}: {
  percentage: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  if (!percentage || percentage <= 0) return null;

  return (
    <View
      style={[styles.discount, { backgroundColor: colors.sale }, style]}
      accessibilityLabel={`${Math.round(percentage)} percent off`}
    >
      <AppText variant="micro" weight="800" style={{ color: colors.text.inverse }}>
        -{Math.round(percentage)}%
      </AppText>
    </View>
  );
});

/**
 * Star rating with the count kept visually separate from the score, so the eye
 * reads "4.6" first and "(128)" second instead of one undifferentiated blob.
 */
export const Rating = React.memo(function Rating({
  value,
  count,
  size = 'md',
  style,
}: {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  if (!value || value <= 0) return null;

  return (
    <View
      style={[
        styles.rating,
        { backgroundColor: withAlpha(colors.rating, 0.14) },
        size === 'sm' ? styles.ratingSm : styles.ratingMd,
        style,
      ]}
      accessibilityLabel={
        count ? `Rated ${value} out of 5 from ${count} reviews` : `Rated ${value} out of 5`
      }
    >
      <Ionicons
        name="star"
        size={size === 'sm' ? iconSize.xs : iconSize.sm}
        color={colors.rating}
      />
      <AppText variant={size === 'sm' ? 'micro' : 'label'} weight="700" tone="title">
        {value.toFixed(1)}
      </AppText>
      {count ? (
        <AppText variant={size === 'sm' ? 'micro' : 'label'} tone="muted">
          ({count > 999 ? '999+' : count})
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeSm: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeMd: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 },
  discount: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.pill,
  },
  ratingSm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  ratingMd: { paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs },
});
