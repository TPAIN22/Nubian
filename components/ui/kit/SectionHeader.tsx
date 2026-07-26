import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Touchable } from './Touchable';
import { AppText } from './Text';
import { HIT_SLOP, iconSize, pressScale, SCREEN_PADDING, spacing } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';
import { useRTL } from '@/hooks/useRTL';

export interface SectionHeaderProps {
  title: string;
  /** One line of context under the title. Keep it short. */
  subtitle?: string;
  /** Renders the trailing "See all" affordance. */
  onActionPress?: () => void;
  actionLabel?: string;
  /** Leading emoji or glyph, e.g. "🔥" for trending. */
  emoji?: string;
  /** Drop the screen gutter when the header already sits inside a padded card. */
  flush?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Header above a content rail or grid.
 *
 * The old header was a 14px bold label with a 4px gold tick beside it, which
 * gave every section the same quiet weight as body copy. This uses the
 * `sectionTitle` step (20/700) and pushes the action into a tinted pill, so the
 * page gains a real scanning rhythm: title → content → title → content.
 */
export const SectionHeader = React.memo(function SectionHeader({
  title,
  subtitle,
  onActionPress,
  actionLabel = 'See all',
  emoji,
  flush = false,
  style,
}: SectionHeaderProps) {
  const colors = useColors();
  const rtl = useRTL();

  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: flush ? 0 : SCREEN_PADDING },
        style,
      ]}
    >
      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <AppText variant="sectionTitle" tone="title" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          {emoji ? <AppText variant="subtitle">{emoji}</AppText> : null}
        </View>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {onActionPress ? (
        <Touchable
          onPress={onActionPress}
          hitSlop={HIT_SLOP}
          scaleTo={pressScale.button}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}, ${title}`}
          style={[styles.action, { backgroundColor: colors.primarySoft }]}
        >
          <AppText variant="label" weight="700" style={{ color: colors.primaryStrong }}>
            {actionLabel}
          </AppText>
          <Ionicons name={rtl.chevronForward} size={iconSize.xs} color={colors.primaryStrong} />
        </Touchable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleBlock: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingStart: spacing.md,
    paddingEnd: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
});
