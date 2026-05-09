import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import {
  formatMoney,
  getProductFinalMoney,
  getProductOriginalMoney,
  getFinalPrice,
  getOriginalPrice,
  hasDiscount,
  type Money,
} from '@/utils/priceUtils';
import { extractCartItemAttributes, getAttributesDisplayText } from '@/utils/cartUtils';
import { normalizeProduct } from '@/domain/product/product.normalize';
import { matchVariant } from '@/domain/variant/variant.match';
import { navigateToProduct } from '@/utils/deepLinks';
import type { CartItem as CartLineItem } from '@/types/cart.types';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';
import { QuantityStepper } from './QuantityStepper';
import { PressableScale } from './PressableScale';

type Props = {
  item: CartLineItem;
  imageSize?: number;
  busy?: boolean;
  onIncrement: (item: CartLineItem) => void;
  onDecrement: (item: CartLineItem) => void;
  onRemove: (item: CartLineItem) => void;
  showVariantChips?: boolean;
};

const buildLineMoney = (amount: number, src: Money | null): Money | number =>
  src ? { amount, currency: src.currency, decimals: src.decimals } : amount;

export const CartItemCard = React.memo(function CartItemCard({
  item,
  imageSize = 92,
  busy,
  onIncrement,
  onDecrement,
  onRemove,
  showVariantChips = true,
}: Props) {
  const t = useCheckoutTheme();
  const writingDirection: 'ltr' | 'rtl' =
    i18n.language === 'ar' ? 'rtl' : 'ltr';

  const imageUri: string | null =
    (item?.product as any)?.images?.[0] || null;

  const attributes = useMemo(
    () => extractCartItemAttributes(item),
    [item],
  );

  const attributesText = useMemo(
    () => getAttributesDisplayText(attributes),
    [attributes],
  );

  const variantChips = useMemo(() => {
    if (!showVariantChips) return [];
    const entries = Object.entries(attributes || {})
      .filter(([_, v]) => v != null && String(v).length > 0)
      .slice(0, 3);
    return entries.map(([k, v]) => ({ key: k, value: String(v) }));
  }, [attributes, showVariantChips]);

  const normalizedProduct = useMemo(
    () => (item?.product ? normalizeProduct(item.product) : null),
    [item?.product],
  );

  const validQty =
    typeof item?.quantity === 'number' && !isNaN(item.quantity)
      ? item.quantity
      : 0;

  const matchingVariant = useMemo(() => {
    if (!normalizedProduct) return null;
    return matchVariant(normalizedProduct, attributes);
  }, [normalizedProduct, attributes]);

  const finalUnitMoney = useMemo(
    () => getProductFinalMoney(normalizedProduct, matchingVariant),
    [normalizedProduct, matchingVariant],
  );
  const originalUnitMoney = useMemo(
    () => getProductOriginalMoney(normalizedProduct, matchingVariant),
    [normalizedProduct, matchingVariant],
  );

  const finalUnit = useMemo(() => {
    if (finalUnitMoney) return finalUnitMoney.amount;
    if (!normalizedProduct) return 0;
    return getFinalPrice(normalizedProduct, { variant: matchingVariant });
  }, [finalUnitMoney, normalizedProduct, matchingVariant]);

  const originalUnit = useMemo(() => {
    if (originalUnitMoney) return originalUnitMoney.amount;
    if (!normalizedProduct) return 0;
    return getOriginalPrice(normalizedProduct, { variant: matchingVariant });
  }, [originalUnitMoney, normalizedProduct, matchingVariant]);

  const showsDiscount = useMemo(() => {
    if (finalUnitMoney && originalUnitMoney) {
      return originalUnitMoney.amount > finalUnitMoney.amount;
    }
    return hasDiscount(normalizedProduct, { variant: matchingVariant });
  }, [finalUnitMoney, originalUnitMoney, normalizedProduct, matchingVariant]);

  const totalFinal = finalUnit * validQty;
  const totalOriginal = originalUnit * validQty;

  const finalLabel = useMemo(
    () => formatMoney(buildLineMoney(totalFinal, finalUnitMoney)),
    [totalFinal, finalUnitMoney],
  );
  const originalLabel = useMemo(
    () => formatMoney(buildLineMoney(totalOriginal, originalUnitMoney)),
    [totalOriginal, originalUnitMoney],
  );

  const stockState = (item?.product as any)?.stockState as
    | 'lowStock'
    | 'outOfStock'
    | undefined;
  const stockHint =
    stockState === 'lowStock'
      ? i18n.t('lowStockWarning') || 'Only a few left in stock'
      : null;

  const goToProduct = () => {
    if (item?.product?._id) {
      navigateToProduct(item.product._id, item.product);
    }
  };

  const productName = item?.product?.name || i18n.t('product') || 'Product';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.card,
          borderColor: t.border,
          opacity: busy ? 0.7 : 1,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      <PressableScale
        onPress={goToProduct}
        accessibilityRole="imagebutton"
        accessibilityLabel={productName}
        scaleTo={0.98}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
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
              styles.image,
              styles.imagePlaceholder,
              {
                width: imageSize,
                height: imageSize,
                backgroundColor: t.surfaceMuted,
              },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={Math.round(imageSize * 0.32)}
              color={t.textTertiary}
            />
          </View>
        )}
      </PressableScale>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.name,
                { color: t.textPrimary, writingDirection },
              ]}
              numberOfLines={2}
              onPress={goToProduct}
            >
              {productName}
            </Text>

            {variantChips.length > 0 ? (
              <View style={styles.chipsRow}>
                {variantChips.map(chip => (
                  <View
                    key={`${chip.key}-${chip.value}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: t.surfaceMuted,
                        borderColor: t.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: t.textSecondary }]}
                      numberOfLines={1}
                    >
                      {chip.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : attributesText ? (
              <Text
                style={[styles.attrs, { color: t.textTertiary }]}
                numberOfLines={1}
              >
                {attributesText}
              </Text>
            ) : null}
          </View>

          <PressableScale
            onPress={() => onRemove(item)}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('cart_removeItem') || 'Remove item'}
            scaleTo={0.9}
            style={[styles.removeBtn]}
          >
            <Ionicons
              name="close"
              size={16}
              color={t.textTertiary}
            />
          </PressableScale>
        </View>

        {stockHint ? (
          <View style={styles.stockRow}>
            <Ionicons
              name="alert-circle-outline"
              size={12}
              color={t.warning}
            />
            <Text
              style={[styles.stockText, { color: t.warning }]}
              numberOfLines={1}
            >
              {stockHint}
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          <QuantityStepper
            value={validQty}
            onIncrement={() => onIncrement(item)}
            onDecrement={() => onDecrement(item)}
            busy={busy}
            size="sm"
          />

          <View style={styles.priceWrap}>
            {showsDiscount ? (
              <Text
                style={[styles.original, { color: t.textTertiary }]}
                numberOfLines={1}
              >
                {originalLabel}
              </Text>
            ) : null}
            <Text
              style={[styles.final, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {finalLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  image: { borderRadius: radius.input },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, alignSelf: 'stretch' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  name: { ...typography.bodyStrong },
  attrs: { ...typography.caption, marginTop: 4 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { ...typography.label, textTransform: 'capitalize' },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  stockText: { ...typography.label, flex: 1 },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexShrink: 1,
  },
  original: {
    ...typography.caption,
    textDecorationLine: 'line-through',
  },
  final: { ...typography.bodyStrong },
});
