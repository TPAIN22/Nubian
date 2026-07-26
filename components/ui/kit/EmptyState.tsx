import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from './Button';
import { AppText } from './Text';
import { iconSize, spacing, withAlpha } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** One or two sentences explaining what happened and what to do next. */
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** `error` swaps the glyph tint to the error colour. */
  tone?: 'neutral' | 'error';
  /** Fill the parent and centre vertically. Off inside a scroll section. */
  fullHeight?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Empty / error / no-results state.
 *
 * Always three parts in the same order — a soft-tinted glyph, a title that
 * names the situation, and a way out. An empty screen with only "No items" is
 * a dead end; every state here offers the next action.
 */
export const EmptyState = React.memo(function EmptyState({
  icon = 'cube-outline',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tone = 'neutral',
  fullHeight = false,
  style,
}: EmptyStateProps) {
  const colors = useColors();
  const glyph = tone === 'error' ? colors.error : colors.primary;

  return (
    <View style={[styles.container, fullHeight ? styles.fullHeight : null, style]}>
      <View style={[styles.glyphWell, { backgroundColor: withAlpha(glyph, 0.1) }]}>
        <Ionicons name={icon} size={iconSize.xxl} color={glyph} />
      </View>

      <View style={styles.copy}>
        <AppText variant="subtitle" tone="title" align="center">
          {title}
        </AppText>
        {description ? (
          <AppText variant="bodySmall" tone="muted" align="center">
            {description}
          </AppText>
        ) : null}
      </View>

      {onAction && actionLabel ? (
        <Button label={actionLabel} onPress={onAction} size="md" style={styles.action} />
      ) : null}

      {onSecondaryAction && secondaryActionLabel ? (
        <Button
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="text"
          size="md"
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.huge,
    gap: spacing.lg,
  },
  fullHeight: { flex: 1 },
  glyphWell: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.sm, maxWidth: 320 },
  action: { minWidth: 180 },
});
