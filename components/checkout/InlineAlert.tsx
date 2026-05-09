import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Tone = 'info' | 'warning' | 'error' | 'success';

type Props = {
  tone?: Tone;
  title?: string;
  message: string;
};

const ICONS: Record<Tone, React.ComponentProps<typeof Ionicons>['name']> = {
  info: 'information-circle-outline',
  warning: 'alert-circle-outline',
  error: 'close-circle-outline',
  success: 'checkmark-circle-outline',
};

export const InlineAlert = React.memo(function InlineAlert({
  tone = 'info',
  title,
  message,
}: Props) {
  const t = useCheckoutTheme();
  const palette = {
    info: { bg: t.surfaceMuted, fg: t.textSecondary, border: t.border },
    warning: { bg: t.warningSoft, fg: t.warning, border: t.warning },
    error: { bg: t.errorSoft, fg: t.error, border: t.error },
    success: { bg: t.successSoft, fg: t.success, border: t.success },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Ionicons name={ICONS[tone]} size={16} color={palette.fg} />
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        <Text
          style={[
            styles.message,
            { color: title ? t.textSecondary : t.textPrimary },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { ...typography.captionStrong, marginBottom: 2 },
  message: { ...typography.caption },
});
