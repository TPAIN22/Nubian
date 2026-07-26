import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Touchable } from './Touchable';
import { AppText } from './Text';
import {
  controlHeight,
  elevation,
  iconSize,
  pressScale,
  radius,
  spacing,
} from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ionicons glyph rendered before the label. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Ionicons glyph rendered after the label (chevrons, external-link…). */
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container width. Sticky CTAs want this. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const SIZE_SPEC: Record<
  ButtonSize,
  { height: number; padH: number; gap: number; text: 'caption' | 'bodySmall' | 'body' | 'subtitle'; icon: number }
> = {
  sm: { height: controlHeight.sm, padH: spacing.md, gap: spacing.xs, text: 'caption', icon: iconSize.sm },
  md: { height: controlHeight.md, padH: spacing.lg, gap: spacing.sm, text: 'bodySmall', icon: iconSize.md },
  lg: { height: controlHeight.lg, padH: spacing.xl, gap: spacing.sm, text: 'body', icon: iconSize.md },
  xl: { height: controlHeight.xl, padH: spacing.xl, gap: spacing.md, text: 'subtitle', icon: iconSize.lg },
};

/**
 * The app's button.
 *
 * Variants exist so a screen expresses *intent* ("this is the primary action")
 * instead of picking a colour. That keeps exactly one gold, high-contrast CTA
 * visible per screen, which is what makes the primary action jump out.
 *
 * Every variant ships the four states a real button needs — default, pressed
 * (spring scale), disabled (flattened, no shadow) and loading (spinner replaces
 * the icon, label stays so the button doesn't resize and shift the layout).
 */
export const Button = React.memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const spec = SIZE_SPEC[size];
  const isInert = disabled || loading;

  const { container, contentColor, showShadow } = useMemo(() => {
    if (disabled) {
      return {
        container: {
          backgroundColor: variant === 'outline' || variant === 'ghost' || variant === 'text'
            ? 'transparent'
            : colors.buttonDisabled,
          borderColor: colors.border,
          borderWidth: variant === 'outline' ? 1 : 0,
        } as ViewStyle,
        contentColor: colors.buttonDisabledText,
        showShadow: false,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.secondary, borderWidth: 0 } as ViewStyle,
          contentColor: colors.onSecondary,
          showShadow: true,
        };
      case 'danger':
        return {
          container: { backgroundColor: colors.error, borderWidth: 0 } as ViewStyle,
          contentColor: colors.text.inverse,
          showShadow: true,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.primary,
          } as ViewStyle,
          contentColor: colors.primary,
          showShadow: false,
        };
      case 'ghost':
        return {
          container: { backgroundColor: colors.primarySoft, borderWidth: 0 } as ViewStyle,
          contentColor: colors.primaryStrong,
          showShadow: false,
        };
      case 'text':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 0 } as ViewStyle,
          contentColor: colors.primaryStrong,
          showShadow: false,
        };
      case 'primary':
      default:
        return {
          container: { backgroundColor: colors.primary, borderWidth: 0 } as ViewStyle,
          contentColor: colors.onPrimary,
          showShadow: true,
        };
    }
  }, [variant, disabled, colors]);

  // `text` is a link-like affordance — no fixed height or side padding so it
  // aligns optically with the copy around it.
  const isTextVariant = variant === 'text';

  return (
    <Touchable
      onPress={isInert ? undefined : onPress}
      disabled={isInert}
      scaleTo={pressScale.button}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInert, busy: loading }}
      testID={testID}
      style={[
        styles.base,
        {
          height: isTextVariant ? undefined : spec.height,
          minHeight: isTextVariant ? spec.height : undefined,
          paddingHorizontal: isTextVariant ? 0 : spec.padH,
          gap: spec.gap,
          borderRadius: radius.button,
        },
        container,
        showShadow ? elevation.sm : null,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <Ionicons name={icon} size={spec.icon} color={contentColor} />
      ) : null}

      <AppText
        variant={spec.text}
        weight="700"
        numberOfLines={1}
        style={[{ color: contentColor }, labelStyle]}
      >
        {label}
      </AppText>

      {iconRight && !loading ? (
        <Ionicons name={iconRight} size={spec.icon} color={contentColor} />
      ) : null}
    </Touchable>
  );
});

/**
 * Icon-only action (close, share, wishlist). Kept in the same file as `Button`
 * so the two never drift apart on radius, shadow or disabled treatment.
 */
export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  glyphSize?: number;
  color?: string;
  background?: string;
  /** Draws a 1px outline — use over photography where fills can blend in. */
  bordered?: boolean;
  elevated?: boolean;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityState?: { selected?: boolean };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const IconButton = React.memo(function IconButton({
  icon,
  onPress,
  size = 40,
  glyphSize,
  color,
  background,
  bordered = false,
  elevated = false,
  disabled = false,
  accessibilityLabel,
  accessibilityState,
  style,
  testID,
}: IconButtonProps) {
  const colors = useColors();
  return (
    <Touchable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      scaleTo={pressScale.icon}
      // Guarantees the 44pt target even when the visual circle is smaller.
      hitSlop={Math.max(0, (44 - size) / 2)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      testID={testID}
      style={[
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background ?? colors.surface,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.border,
        },
        elevated ? elevation.sm : null,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={glyphSize ?? Math.round(size * 0.5)}
        color={disabled ? colors.text.disabled : (color ?? colors.text.body)}
      />
    </Touchable>
  );
});

/**
 * Pairs two buttons on one row with the correct visual weight split: the
 * primary action gets ~2/3 of the width so it stays the obvious choice.
 */
export const ButtonRow = React.memo(function ButtonRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
