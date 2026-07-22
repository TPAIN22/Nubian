import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
  // Plain RN Text for the label on the colored CTA fill: the themed <Text>
  // carries a NativeWind className color that overrides inline color.
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';

type Props = {
  // Kept for API compatibility with existing callers (cart + checkout). The
  // total now lives in the order summary, so it's no longer rendered here.
  total?: number;
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

// Brand gold (primary) as literals. The colored surface is a plain <View> with
// a static style so it always paints — NativeWind's jsx runtime drops the
// function form of Pressable's `style` prop, which silently ate the fill before.
const GOLD = '#A37E2C';
const GOLD_PRESSED = '#8A6824';
const INK = '#FFFFFF';

export const CheckoutFooter = React.memo(function CheckoutFooter({
  ctaLabel,
  hint,
  loading,
  disabled,
  onPress,
  variant = 'cart',
  withSafeArea = true,
}: Props) {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const [pressed, setPressed] = useState(false);

  const isDisabled = !!(disabled || loading);

  const ctaTitle =
    ctaLabel ||
    (variant === 'cart'
      ? i18n.t('checkout') || 'Checkout'
      : i18n.t('placeOrder') || 'Place order');

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: t.surface,
          borderTopColor: t.divider,
          paddingBottom: withSafeArea ? Math.max(insets.bottom, 12) : 12,
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

      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={ctaTitle}
        accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      >
        {/* Visual surface is a plain View with a STATIC style object so the
            gold fill is guaranteed to render under NativeWind. */}
        <View
          style={{
            width: '100%',
            height: 56,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? GOLD_PRESSED : GOLD,
            opacity: isDisabled ? 0.5 : 1,
            shadowColor: '#000000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={INK} />
          ) : (
            <RNText
              numberOfLines={1}
              style={{
                color: INK,
                fontSize: 17,
                fontWeight: '800',
                letterSpacing: 0.2,
                fontFamily: Platform.OS === 'web' ? undefined : 'Cairo-Bold',
              }}
            >
              {ctaTitle}
            </RNText>
          )}
        </View>
      </Pressable>
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
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  hintText: { fontSize: 13, flex: 1 },
});
