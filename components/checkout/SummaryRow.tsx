import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from './theme';
import { spacing, typography } from './tokens';

type Tone = 'default' | 'discount' | 'muted' | 'total';

type Props = {
  label: string;
  value: string;
  tone?: Tone;
  hint?: string;
};

export const SummaryRow = React.memo(function SummaryRow({
  label,
  value,
  tone = 'default',
  hint,
}: Props) {
  const t = useCheckoutTheme();

  const labelColor =
    tone === 'total' ? t.textPrimary : t.textSecondary;
  const valueColor =
    tone === 'discount'
      ? t.success
      : tone === 'muted'
        ? t.textTertiary
        : t.textPrimary;

  const valueStyle = tone === 'total' ? styles.totalValue : styles.value;
  const labelStyle = tone === 'total' ? styles.totalLabel : styles.label;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[labelStyle, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text
            style={[styles.hint, { color: t.textTertiary }]}
            numberOfLines={1}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      <Text
        style={[valueStyle, { color: valueColor }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  label: { ...typography.body },
  value: { ...typography.bodyStrong },
  totalLabel: { ...typography.subtitle },
  totalValue: { ...typography.totalAmount },
  hint: { ...typography.caption, marginTop: 2 },
});
