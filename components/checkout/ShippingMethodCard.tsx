import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Props = {
  /** Resolved shipping fee for the current quote. 0 (or less) renders as "Free". */
  shippingFee: number;
  /** True while a quote request is in flight — shows a spinner in the fee pill. */
  loading?: boolean;
  format: (n: number) => string;
  title?: string;
  eta?: string;
};

/**
 * The single standard-delivery option shown on checkout. It's presented as a
 * selected card (the only method today) so the section reads consistently with
 * the payment cards. Extracted from the checkout orchestrator; the fee it shows
 * is whatever the quote resolves — this component computes nothing.
 */
export const ShippingMethodCard = React.memo(function ShippingMethodCard({
  shippingFee,
  loading,
  format,
  title,
  eta,
}: Props) {
  const t = useCheckoutTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: t.accent, borderWidth: 1.5 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: t.accentSoft }]}>
        <Ionicons name="cube-outline" size={20} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {title || i18n.t('standardDelivery') || 'Standard delivery'}
        </Text>
        <Text style={[styles.caption, { color: t.textTertiary }]}>
          {eta ||
            i18n.t('standardDeliveryEta') ||
            'Estimated 2–4 business days'}
        </Text>
      </View>
      <View style={[styles.amount, { backgroundColor: t.surfaceMuted }]}>
        {loading ? (
          <ActivityIndicator size="small" color={t.textSecondary} />
        ) : (
          <Text style={[styles.amountText, { color: t.textPrimary }]}>
            {shippingFee > 0 ? format(shippingFee) : i18n.t('free') || 'Free'}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.card,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.bodyStrong },
  caption: { ...typography.caption, marginTop: 2 },
  amount: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    minWidth: 56,
    alignItems: 'center',
  },
  amountText: { ...typography.captionStrong },
});
