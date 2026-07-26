import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Touchable } from './Touchable';
import { AppText } from './Text';
import { controlHeight, iconSize, pressScale, radius, spacing } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders an × so the chip can be removed (active filters, applied coupon). */
  onRemove?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Selectable pill: category filters, sort options, size/colour swatches, saved
 * search terms.
 *
 * Selection is signalled by a brand fill *and* a weight change, not colour
 * alone, so it survives greyscale and low-vision viewing. The container height
 * clears the 44pt target at `md`; `sm` is only for chips inside an already
 * tappable row.
 */
export const Chip = React.memo(function Chip({
  label,
  selected = false,
  onPress,
  icon,
  onRemove,
  disabled = false,
  size = 'md',
  style,
  testID,
}: ChipProps) {
  const colors = useColors();

  const bg = disabled
    ? colors.surfaceMuted
    : selected
      ? colors.primary
      : colors.surface;
  const fg = disabled
    ? colors.text.disabled
    : selected
      ? colors.onPrimary
      : colors.text.body;
  const border = disabled
    ? colors.border
    : selected
      ? colors.primary
      : colors.border;

  return (
    <Touchable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      scaleTo={pressScale.button}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      testID={testID}
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : styles.chipMd,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={size === 'sm' ? iconSize.xs : iconSize.sm} color={fg} />
      ) : null}

      <AppText
        variant={size === 'sm' ? 'label' : 'bodySmall'}
        weight={selected ? '700' : '600'}
        numberOfLines={1}
        style={{ color: fg }}
      >
        {label}
      </AppText>

      {onRemove ? (
        <Ionicons
          name="close"
          size={iconSize.sm}
          color={fg}
          onPress={onRemove}
          suppressHighlighting
        />
      ) : null}
    </Touchable>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  chipSm: {
    height: controlHeight.sm,
    paddingHorizontal: spacing.md,
  },
  chipMd: {
    height: controlHeight.md,
    paddingHorizontal: spacing.base,
  },
});
