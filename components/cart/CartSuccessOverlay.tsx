/**
 * `CartSuccessOverlay` — the floating "Added to cart" confirmation.
 *
 * Replaces the old `toast.success("Product added to cart")`. A plain toast said
 * *that* something happened; this says *what* happened (thumbnail + product
 * name) and offers the only action a shopper wants next ("View cart") without
 * taking them out of the flow.
 *
 * It is deliberately anchored to the bottom: the global notification cards own
 * the top of the screen, so the two can never collide or stack.
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeOutDown,
  SlideInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { radius, spacing, typography } from '@/theme/tokens';

import { cartStrings as S } from './strings';
import type { CartConfirmation } from './cartFeedback';

export const CONFIRMATION_DURATION_MS = 2800;

type Props = {
  confirmation: CartConfirmation;
  onDismiss: () => void;
  /** Extra bottom offset so the card clears a tab bar. */
  bottomOffset?: number;
};

export const CartSuccessOverlay = React.memo(function CartSuccessOverlay({
  confirmation,
  onDismiss,
  bottomOffset = 76,
}: Props) {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDismiss, CONFIRMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDismiss, confirmation.id]);

  const handleViewCart = useCallback(() => {
    confirmation.onViewCart?.();
    onDismiss();
  }, [confirmation, onDismiss]);

  return (
    <Animated.View
      // A plain timed slide, not a spring: `.springify()` overshot the resting
      // position and rebounded, which read as the card "bouncing in". This
      // slides up once and stops.
      entering={reduceMotion ? undefined : SlideInDown.duration(260)}
      exiting={reduceMotion ? undefined : FadeOutDown.duration(200)}
      style={[
        styles.wrap,
        { bottom: insets.bottom + bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handleViewCart}
        accessibilityRole="button"
        accessibilityLabel={`${confirmation.title}. ${confirmation.subtitle ?? ''}`}
        accessibilityHint={S.viewCart()}
        style={[
          styles.card,
          {
            backgroundColor: t.cardElevated,
            borderColor: t.border,
            shadowColor: '#000',
          },
        ]}
      >
        <View style={[styles.thumbWrap, { backgroundColor: t.surfaceMuted }]}>
          {confirmation.uri ? (
            <Image
              source={{ uri: confirmation.uri }}
              style={styles.thumb}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <Ionicons name="bag-check" size={20} color={t.success} />
          )}
          <View style={[styles.tick, { backgroundColor: t.success, borderColor: t.cardElevated }]}>
            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.body}>
          <Text
            style={[styles.title, { color: t.textPrimary }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.5}
          >
            {confirmation.title}
          </Text>
          {confirmation.subtitle ? (
            <Text
              style={[styles.subtitle, { color: t.textTertiary }]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
            >
              {confirmation.subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.cta, { backgroundColor: t.accentSoft }]}>
          <Text
            style={[styles.ctaText, { color: t.accentText }]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
          >
            {S.viewCart()}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 2,
    paddingRight: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: { width: 44, height: 44, borderRadius: 10 },
  tick: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong },
  subtitle: { ...typography.caption },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  ctaText: { ...typography.label, fontWeight: '700' },
});
