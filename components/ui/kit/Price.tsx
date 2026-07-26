import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from './Text';
import { spacing, typography } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export type PriceSize = 'sm' | 'md' | 'lg';

export interface PriceProps {
  /** Pre-formatted, currency-aware string. This component never formats money. */
  value: string;
  /** Pre-formatted was-price. Omit when there's no discount. */
  original?: string | null;
  /** Prefixes "From" — for products priced by variant. */
  isFrom?: boolean;
  size?: PriceSize;
  /** Stack the was-price under the price instead of beside it. */
  stacked?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<PriceSize, { current: 'priceSmall' | 'price' | 'priceHero'; from: 'micro' | 'caption' }> = {
  sm: { current: 'priceSmall', from: 'micro' },
  md: { current: 'price', from: 'caption' },
  lg: { current: 'priceHero', from: 'caption' },
};

/**
 * Price block with a fixed hierarchy: the amount you pay is the largest, boldest
 * thing; the was-price is small, grey and struck through beside it.
 *
 * Centralising this is what stops price emphasis drifting per screen — before,
 * a card price was 14/700 gold while the details price was 20/600 gold, which
 * made neither read as "the number that matters".
 *
 * Formatting stays with the caller (`formatMoney` / `useCurrencyStore`), because
 * currency conversion is business logic and must not live in a view.
 */
export const Price = React.memo(function Price({
  value,
  original,
  isFrom = false,
  size = 'md',
  stacked = false,
  style,
}: PriceProps) {
  const colors = useColors();
  const spec = SIZE_MAP[size];
  const hasOriginal = Boolean(original) && original !== value;

  return (
    <View style={[stacked ? styles.stacked : styles.inline, style]}>
      <View style={styles.currentWrap}>
        {isFrom ? (
          <AppText variant={spec.from} tone="muted" style={styles.from}>
            From
          </AppText>
        ) : null}
        <AppText
          variant={spec.current}
          numberOfLines={1}
          style={{ color: colors.text.price }}
          accessibilityLabel={`Price ${value}`}
        >
          {value}
        </AppText>
      </View>

      {hasOriginal ? (
        <AppText
          variant="caption"
          tone="subtle"
          numberOfLines={1}
          style={[typography.priceStrike, { color: colors.text.subtle }]}
          accessibilityLabel={`Was ${original}`}
        >
          {original}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stacked: { gap: spacing.xxs },
  currentWrap: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  from: { alignSelf: 'flex-end' },
});
