import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './Text';
import { spacing } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export interface SeparatorProps {
  /** `hairline` sits inside a card; `block` separates whole sections. */
  variant?: 'hairline' | 'block';
  /** Indent from the leading edge — align it with the content, not the card. */
  inset?: number;
  /** Vertical breathing room around the line. */
  spacingY?: keyof typeof spacing | number;
  style?: StyleProp<ViewStyle>;
}

/**
 * List and section divider.
 *
 * `hairline` is a true 1px line for rows inside one card. `block` is the 8px
 * canvas-coloured band used *between* cards — it separates far more clearly
 * than a line while adding the whitespace the old layout lacked.
 */
export const Separator = React.memo(function Separator({
  variant = 'hairline',
  inset = 0,
  spacingY,
  style,
}: SeparatorProps) {
  const colors = useColors();
  const gap =
    spacingY === undefined
      ? 0
      : typeof spacingY === 'number'
        ? spacingY
        : spacing[spacingY];

  if (variant === 'block') {
    return (
      <View
        style={[{ height: spacing.sm, backgroundColor: colors.background }, style]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth * 2,
          backgroundColor: colors.divider,
          marginStart: inset,
          marginVertical: gap,
        },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
});

/** A divider with centred copy — "or continue with", "Recently viewed". */
export const LabelledSeparator = React.memo(function LabelledSeparator({
  label,
  style,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View style={[styles.labelled, style]}>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  labelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
});
