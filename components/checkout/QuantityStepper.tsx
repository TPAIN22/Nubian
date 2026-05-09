import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { typography } from './tokens';

type Props = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  busy?: boolean;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
};

export const QuantityStepper = React.memo(function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
  busy,
  min = 1,
  max,
  size = 'md',
}: Props) {
  const t = useCheckoutTheme();
  const isMin = value <= min;
  const isMax = max != null && value >= max;
  const dim = size === 'sm' ? 32 : 36;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: t.border, backgroundColor: t.surfaceMuted, height: dim + 4 },
      ]}
      accessibilityRole="adjustable"
      accessibilityLabel={i18n.t('cart_quantity') || 'Quantity'}
      accessibilityValue={{ text: String(value) }}
    >
      <Pressable
        onPress={onDecrement}
        disabled={busy || isMin}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('cart_decreaseQuantity') || 'Decrease quantity'}
        accessibilityState={{ disabled: busy || isMin }}
        style={({ pressed }) => [
          styles.btn,
          { width: dim, height: dim },
          pressed && !isMin && { opacity: 0.6 },
        ]}
      >
        <Ionicons
          name="remove"
          size={iconSize}
          color={isMin ? t.textTertiary : t.textPrimary}
        />
      </Pressable>

      <View style={[styles.valueWrap, { width: dim }]}>
        {busy ? (
          <ActivityIndicator size="small" color={t.textSecondary} />
        ) : (
          <Text style={[styles.valueText, { color: t.textPrimary }]}>
            {value}
          </Text>
        )}
      </View>

      <Pressable
        onPress={onIncrement}
        disabled={busy || isMax}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('cart_increaseQuantity') || 'Increase quantity'}
        accessibilityState={{ disabled: busy || isMax }}
        style={({ pressed }) => [
          styles.btn,
          { width: dim, height: dim },
          pressed && !isMax && { opacity: 0.6 },
        ]}
      >
        <Ionicons
          name="add"
          size={iconSize}
          color={isMax ? t.textTertiary : t.textPrimary}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  valueText: { ...typography.captionStrong },
});
