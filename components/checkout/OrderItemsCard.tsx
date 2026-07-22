import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import {
  formatMoney,
  getProductFinalMoney,
  getFinalPrice,
  type Money,
} from '@/utils/priceUtils';
import { extractCartItemAttributes } from '@/utils/cartUtils';
import { normalizeProduct } from '@/domain/product/product.normalize';
import { matchVariant } from '@/domain/variant/variant.match';
import type { CartItem } from '@/types/cart.types';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

/**
 * Read-only order line-items list for the checkout screen. Intentionally has no
 * quantity steppers or remove actions — quantity edits live on the cart screen
 * (see `CartItemCard`). This component only mirrors what the user is buying so
 * the checkout doesn't hide the products behind a bare item count.
 */

type Props = {
  items: CartItem[];
  imageSize?: number;
};

const buildLineMoney = (amount: number, src: Money | null): Money | number =>
  src ? { amount, currency: src.currency, decimals: src.decimals } : amount;

type Row = {
  key: string;
  imageUri: string | null;
  name: string;
  chips: string[];
  quantity: number;
  lineLabel: string;
};

function useRows(items: CartItem[]): Row[] {
  return useMemo(() => {
    return (items || []).map((item, index) => {
      const attributes = extractCartItemAttributes(item);
      const chips = Object.entries(attributes || {})
        .filter(([, v]) => v != null && String(v).length > 0)
        .slice(0, 3)
        .map(([, v]) => String(v));

      const normalized = item?.product ? normalizeProduct(item.product) : null;
      const variant = normalized ? matchVariant(normalized, attributes) : null;

      const finalMoney = getProductFinalMoney(normalized, variant);
      const unit = finalMoney
        ? finalMoney.amount
        : normalized
          ? getFinalPrice(normalized, { variant })
          : 0;

      const quantity =
        typeof item?.quantity === 'number' && !isNaN(item.quantity)
          ? item.quantity
          : 0;

      return {
        key: item?._id || `${item?.product?._id ?? 'item'}-${index}`,
        imageUri: (item?.product as any)?.images?.[0] || null,
        name: item?.product?.name || i18n.t('product') || 'Product',
        chips,
        quantity,
        lineLabel: formatMoney(buildLineMoney(unit * quantity, finalMoney)),
      };
    });
  }, [items]);
}

export const OrderItemsCard = React.memo(function OrderItemsCard({
  items,
  imageSize = 56,
}: Props) {
  const t = useCheckoutTheme();
  const rows = useRows(items);
  const writingDirection: 'ltr' | 'rtl' =
    i18n.language === 'ar' ? 'rtl' : 'ltr';

  if (!rows.length) return null;

  return (
    <View>
      {rows.map((row, index) => (
        <View
          key={row.key}
          style={[
            styles.row,
            {
              flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
              borderTopColor: t.divider,
              borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <View style={styles.thumbWrap}>
            {row.imageUri ? (
              <Image
                source={{ uri: row.imageUri }}
                style={[
                  styles.thumb,
                  {
                    width: imageSize,
                    height: imageSize,
                    backgroundColor: t.surfaceMuted,
                  },
                ]}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <View
                style={[
                  styles.thumb,
                  styles.thumbPlaceholder,
                  {
                    width: imageSize,
                    height: imageSize,
                    backgroundColor: t.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="image-outline"
                  size={Math.round(imageSize * 0.34)}
                  color={t.textTertiary}
                />
              </View>
            )}
            <View
              style={[
                styles.qtyBadge,
                { backgroundColor: t.textPrimary, borderColor: t.surface },
              ]}
              accessibilityElementsHidden
            >
              <Text style={[styles.qtyText, { color: t.surface }]}>
                {row.quantity}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text
              style={[styles.name, { color: t.textPrimary, writingDirection }]}
              numberOfLines={2}
            >
              {row.name}
            </Text>
            {row.chips.length > 0 ? (
              <Text
                style={[styles.attrs, { color: t.textTertiary }]}
                numberOfLines={1}
              >
                {row.chips.join(' · ')}
              </Text>
            ) : null}
          </View>

          <Text
            style={[styles.price, { color: t.textPrimary }]}
            numberOfLines={1}
          >
            {row.lineLabel}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  thumbWrap: { position: 'relative' },
  thumb: { borderRadius: radius.input },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  qtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { ...typography.label, fontWeight: '700' },
  body: { flex: 1 },
  name: { ...typography.bodyStrong },
  attrs: { ...typography.caption, marginTop: 2 },
  price: { ...typography.bodyStrong },
});
