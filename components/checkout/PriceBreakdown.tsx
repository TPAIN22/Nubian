import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { spacing, typography } from './tokens';
import { SummaryRow } from './SummaryRow';

export type PricingShape = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
};

type Props = {
  pricing: PricingShape | null | undefined;
  itemCount?: number;
  format: (n: number) => string;
  couponLabel?: string;
  estimatedDelivery?: string;
  showTrustNote?: boolean;
};

export const PriceBreakdown = React.memo(function PriceBreakdown({
  pricing,
  itemCount,
  format,
  couponLabel,
  estimatedDelivery,
  showTrustNote = true,
}: Props) {
  const t = useCheckoutTheme();
  if (!pricing) return null;

  const { subtotal, shippingFee, discount, total } = pricing;

  return (
    <View>
      {typeof itemCount === 'number' ? (
        <SummaryRow
          label={i18n.t('cart_subtotal') || 'Subtotal'}
          value={format(subtotal)}
          hint={
            itemCount > 0
              ? `${itemCount} ${itemCount === 1 ? i18n.t('item') || 'item' : i18n.t('items') || 'items'}`
              : undefined
          }
        />
      ) : (
        <SummaryRow
          label={i18n.t('cart_subtotal') || 'Subtotal'}
          value={format(subtotal)}
        />
      )}

      <SummaryRow
        label={i18n.t('cart_shipping') || 'Shipping'}
        value={shippingFee > 0 ? format(shippingFee) : i18n.t('free') || 'Free'}
        tone={shippingFee > 0 ? 'default' : 'muted'}
        hint={estimatedDelivery}
      />

      {discount > 0 ? (
        <SummaryRow
          label={
            couponLabel
              ? `${i18n.t('discount') || 'Discount'} · ${couponLabel}`
              : i18n.t('discount') || 'Discount'
          }
          value={`− ${format(discount)}`}
          tone="discount"
        />
      ) : null}

      <View
        style={[styles.divider, { backgroundColor: t.divider }]}
        accessibilityElementsHidden
      />

      <SummaryRow
        label={i18n.t('grandTotal') || 'Total'}
        value={format(total)}
        tone="total"
      />

      {showTrustNote ? (
        <View style={styles.trustRow}>
          <Ionicons
            name="lock-closed"
            size={12}
            color={t.textTertiary}
          />
          <Text
            style={[styles.trustText, { color: t.textTertiary }]}
            numberOfLines={2}
          >
            {i18n.t('checkout_secureNote') ||
              'Your payment information is encrypted and secure.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
  },
  trustText: { ...typography.caption, flex: 1 },
});
