import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import axiosInstance from '@/services/api/client';
import type { CouponValidationResult } from '@/components/CouponInput';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Props = {
  products: { productId: string; categoryId?: string }[];
  userId?: string;
  orderAmount: number;
  applied: CouponValidationResult | null;
  format: (n: number) => string;
  onApply: (result: CouponValidationResult) => void;
  onRemove: () => void;
};

export const CouponField = React.memo(function CouponField({
  products,
  userId,
  orderAmount,
  applied,
  format,
  onApply,
  onRemove,
}: Props) {
  const t = useCheckoutTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError(i18n.t('coupon_required') || 'Enter a coupon code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const productIds = products.map(p => p.productId).filter(Boolean);
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (orderAmount) params.append('orderAmount', String(orderAmount));
      if (productIds.length) params.append('productIds', productIds.join(','));

      const url = `/coupons/code/${trimmed}?${params.toString()}`;
      const res = await axiosInstance.get(url);
      const ok = res.data?.success && res.data?.data;
      if (!ok) throw new Error('Invalid response');

      const data = res.data.data;
      const validation = data.validation;
      if (!validation?.valid) {
        setError(
          validation?.errors?.[0] ||
            i18n.t('coupon_invalid') ||
            'Coupon is not valid',
        );
        return;
      }

      const coupon = data.coupon;
      const preview = data.discountPreview;
      const result: CouponValidationResult = {
        code: coupon.code,
        valid: true,
        type: coupon.type,
        value: coupon.value,
        discountAmount: preview?.discountAmount || 0,
        originalAmount: preview?.originalAmount || orderAmount,
        finalAmount:
          preview?.finalAmount ||
          orderAmount - (preview?.discountAmount || 0),
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount,
        message: 'ok',
        discountType: coupon.type,
        discountValue: coupon.value,
        expiresAt: coupon.endDate,
      };
      onApply(result);
      setCode('');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          i18n.t('coupon_validateError') ||
          'Could not validate coupon',
      );
    } finally {
      setLoading(false);
    }
  }, [code, onApply, orderAmount, products, userId]);

  if (applied?.valid) {
    return (
      <View
        style={[
          styles.appliedWrap,
          {
            backgroundColor: t.successSoft,
            borderColor: t.success,
          },
        ]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.appliedRow}>
          <View style={styles.appliedLeft}>
            <View
              style={[
                styles.appliedIcon,
                { backgroundColor: t.success },
              ]}
            >
              <Ionicons name="pricetag" size={12} color={t.textInverse} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text
                style={[styles.appliedCode, { color: t.textPrimary }]}
                numberOfLines={1}
              >
                {applied.code}
              </Text>
              <Text
                style={[styles.appliedSavings, { color: t.success }]}
                numberOfLines={1}
              >
                {i18n.t('youSaved') || 'You saved'} {format(applied.discountAmount)}
                {applied.type === 'percentage' ? ` · ${applied.value}%` : ''}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('remove') || 'Remove'}
            hitSlop={10}
            style={({ pressed }) => [
              styles.removeBtn,
              { borderColor: t.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[styles.removeText, { color: t.textSecondary }]}
            >
              {i18n.t('remove') || 'Remove'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error ? t.error : t.border,
            backgroundColor: t.card,
            flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Ionicons
          name="pricetag-outline"
          size={16}
          color={t.textTertiary}
        />
        <TextInput
          value={code}
          onChangeText={text => {
            setCode(text.toUpperCase());
            if (error) setError('');
          }}
          placeholder={
            i18n.t('cart_couponPlaceholder') || 'Promo code'
          }
          placeholderTextColor={t.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleApply}
          style={[
            styles.input,
            {
              color: t.textPrimary,
              textAlign: I18nManager.isRTL ? 'right' : 'left',
            },
          ]}
          accessibilityLabel={i18n.t('cart_couponPlaceholder') || 'Promo code'}
        />
        <Pressable
          onPress={handleApply}
          disabled={loading || !code.trim()}
          hitSlop={6}
          style={({ pressed }) => [
            styles.applyBtn,
            {
              opacity: !code.trim() || loading ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={t.accent} />
          ) : (
            <Text style={[styles.applyText, { color: t.accent }]}>
              {i18n.t('cart_couponApply') || 'Apply'}
            </Text>
          )}
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle"
            size={13}
            color={t.error}
          />
          <Text
            style={[styles.errorText, { color: t.error }]}
            numberOfLines={2}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  inputRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
  },
  applyBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 48,
    alignItems: 'center',
  },
  applyText: { ...typography.bodyStrong },

  appliedWrap: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  appliedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedCode: { ...typography.bodyStrong },
  appliedSavings: { ...typography.caption, marginTop: 2 },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  removeText: { ...typography.captionStrong },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs + 2,
  },
  errorText: { ...typography.caption, flex: 1 },
});
