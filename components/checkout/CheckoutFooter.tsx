import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Props = {
  total: number;
  currency?: string;
  ctaLabel?: string;
  caption?: string;
  hint?: string | null;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  itemCount?: number;
  variant?: 'cart' | 'checkout';
  withSafeArea?: boolean;
};

const FOOTER_HEIGHT = 56;

export const CheckoutFooter = React.memo(function CheckoutFooter({
  total,
  currency,
  ctaLabel,
  caption,
  hint,
  loading,
  disabled,
  onPress,
  itemCount,
  variant = 'cart',
  withSafeArea = true,
}: Props) {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const activeCode = useCurrencyStore(s => s.currencyCode);
  const currencies = useCurrencyStore(s => s.currencies);

  const code = currency || activeCode || '';
  const resolved = useMemo(
    () => currencies.find(c => c.code === code) ?? null,
    [currencies, code],
  );
  const decimals = resolved?.decimals ?? 2;
  const symbol = resolved?.symbol || code || '';
  const symbolAfter = resolved?.symbolPosition === 'after';

  const formattedTotal = useMemo(
    () =>
      total.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [total, decimals],
  );

  const totalLabel = symbol
    ? symbolAfter
      ? `${formattedTotal} ${symbol}`
      : `${symbol} ${formattedTotal}`
    : formattedTotal;

  const isDisabled = !!(disabled || loading);

  const ctaTitle =
    ctaLabel ||
    (variant === 'cart'
      ? i18n.t('checkout') || 'Checkout'
      : i18n.t('placeOrder') || 'Place order');

  const fallbackCaption =
    typeof itemCount === 'number' && itemCount > 0
      ? `${itemCount} ${itemCount === 1 ? i18n.t('item') || 'item' : i18n.t('items') || 'items'}`
      : null;

  // Solid, opaque, never-themed-to-disappear colors. We avoid resolving these
  // through the theme on the off-chance a token is missing — a checkout button
  // that is invisible because of a typo in a palette is unforgivable.
  const buttonBg = isDisabled ? '#9CA3AF' : t.isDark ? '#FFFFFF' : '#111827';
  const buttonFg = isDisabled ? '#FFFFFF' : t.isDark ? '#111827' : '#FFFFFF';

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: t.surface,
          borderTopColor: t.divider,
          paddingBottom: withSafeArea
            ? Math.max(insets.bottom, 12)
            : 12,
        },
      ]}
    >
      {hint ? (
        <View
          style={[styles.hintRow, { backgroundColor: t.warningSoft }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Ionicons name="information-circle" size={16} color={t.warning} />
          <Text
            style={[styles.hintText, { color: t.textPrimary }]}
            numberOfLines={3}
          >
            {hint}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text
          style={[styles.metaLabel, { color: t.textTertiary }]}
          numberOfLines={1}
        >
          {(caption || i18n.t('orderTotal') || 'Order total').toUpperCase()}
        </Text>
        <Text
          style={[styles.metaValue, { color: t.textPrimary }]}
          numberOfLines={1}
        >
          {totalLabel}
        </Text>
      </View>

      {fallbackCaption ? (
        <Text
          style={[styles.subMeta, { color: t.textTertiary }]}
          numberOfLines={1}
        >
          {fallbackCaption}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={`${ctaTitle}, ${totalLabel}`}
        accessibilityState={{ disabled: isDisabled, busy: !!loading }}
        style={[
          styles.cta,
          { backgroundColor: buttonBg },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={buttonFg} />
        ) : (
          <View style={styles.ctaInner}>
            <Text
              style={[styles.ctaText, { color: buttonFg }]}
              numberOfLines={1}
            >
              {ctaTitle}
            </Text>
           
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.input,
    marginBottom: 12,
  },
  hintText: { ...typography.caption, flex: 1 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subMeta: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 12,
  },

  cta: {
    height: FOOTER_HEIGHT,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconLtr: { marginLeft: 8 },
  iconRtl: { marginRight: 8, transform: [{ scaleX: -1 }] },
});
