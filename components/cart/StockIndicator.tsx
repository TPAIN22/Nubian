/**
 * `StockIndicator` — one consistent way to say how much of something is left.
 *
 * Reads **only** values the product already carries (variant `stock` or
 * `simple.stock`); it never estimates, rounds or invents a number. The
 * "low stock" cut-off is `LOW_STOCK_THRESHOLD`, the same `> 5` rule the product
 * details screen has always used — moved into one constant so the card, the
 * details page and the cart can't drift apart.
 *
 * Colour comes from the semantic palette (success / warning / error), so it is
 * legible in both themes, and the state is also carried by an icon and by text
 * — never colour alone.
 */

import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { typography } from '@/theme/tokens';

import { cartStrings as S } from './strings';
import type { StockLevel } from './useAddToCart';

type Props = {
  level: StockLevel;
  /** Exact units left. Only rendered for `lowStock`, and only when known. */
  stock?: number | null;
  /** `dot` for the compact inline form, `pill` for a filled chip. */
  variant?: 'dot' | 'pill';
  style?: StyleProp<ViewStyle>;
  /** Hide entirely when the data doesn't say anything (default). */
  hideWhenUnknown?: boolean;
};

export const StockIndicator = React.memo(function StockIndicator({
  level,
  stock,
  variant = 'dot',
  style,
  hideWhenUnknown = true,
}: Props) {
  const t = useCheckoutTheme();

  if (level === 'unknown' && hideWhenUnknown) return null;

  const config = (() => {
    switch (level) {
      case 'inStock':
        return {
          color: t.success,
          soft: t.successSoft,
          icon: 'checkmark-circle' as const,
          text: S.inStock(),
        };
      case 'lowStock':
        return {
          color: t.warning,
          soft: t.warningSoft,
          icon: 'flame' as const,
          text:
            typeof stock === 'number' && stock > 0
              ? S.onlyNLeft(stock)
              : S.lowStock(),
        };
      case 'outOfStock':
        return {
          color: t.error,
          soft: t.errorSoft,
          icon: 'close-circle' as const,
          text: S.outOfStock(),
        };
      default:
        return {
          color: t.textTertiary,
          soft: 'transparent',
          icon: 'ellipse-outline' as const,
          text: '',
        };
    }
  })();

  const a11yLabel = config.text;

  if (variant === 'pill') {
    return (
      <Animated.View
        entering={FadeIn.duration(180)}
        style={[styles.pill, { backgroundColor: config.soft }, style]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={a11yLabel}
      >
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text
          style={[styles.pillText, { color: config.color }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}
        >
          {config.text}
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[styles.row, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[styles.text, { color: config.color }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}
      >
        {config.text}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  text: { ...typography.captionStrong, fontWeight: '500' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { ...typography.label },
});
