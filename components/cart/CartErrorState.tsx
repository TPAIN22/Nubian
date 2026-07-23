/**
 * `CartErrorState` — an actionable failure card.
 *
 * The cart screen used to render a raw `InlineAlert` containing whatever string
 * the store happened to hold, with nothing to press. Failures now say what went
 * wrong in the customer's language, distinguish "you're offline" from "the
 * server said no", and always give at least one way forward.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';

import { cartStrings as S } from './strings';
import type { CartErrorKind } from './cartErrors';

export { classifyCartError } from './cartErrors';
export type { CartErrorKind } from './cartErrors';

type Props = {
  kind?: CartErrorKind;
  title?: string;
  message?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

const ICONS: Record<CartErrorKind, keyof typeof Ionicons.glyphMap> = {
  network: 'cloud-offline-outline',
  auth: 'lock-closed-outline',
  stock: 'alert-circle-outline',
  generic: 'warning-outline',
};

export const CartErrorState = React.memo(function CartErrorState({
  kind = 'generic',
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  const t = useCheckoutTheme();

  const tone =
    kind === 'network' ? t.warning : kind === 'auth' ? t.accent : t.error;
  const toneSoft =
    kind === 'network' ? t.warningSoft : kind === 'auth' ? t.accentSoft : t.errorSoft;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.wrap, { backgroundColor: t.card, borderColor: t.border }]}
      accessible
      accessibilityRole="alert"
    >
      <View style={[styles.iconWrap, { backgroundColor: toneSoft }]}>
        <Ionicons name={ICONS[kind]} size={26} color={tone} />
      </View>

      <Text
        style={[styles.title, { color: t.textPrimary }]}
        numberOfLines={2}
        maxFontSizeMultiplier={1.5}
      >
        {title ?? S.somethingWentWrong()}
      </Text>

      <Text
        style={[styles.message, { color: t.textTertiary }]}
        numberOfLines={4}
        maxFontSizeMultiplier={1.5}
      >
        {message ?? (kind === 'network' ? S.checkConnection() : '')}
      </Text>

      <View style={styles.actions}>
        {onPrimary ? (
          <Pressable
            onPress={onPrimary}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel ?? S.retry()}
            style={[styles.primary, { backgroundColor: t.cta }]}
          >
            <Text
              style={[styles.primaryText, { color: t.ctaText }]}
              maxFontSizeMultiplier={1.4}
            >
              {primaryLabel ?? S.retry()}
            </Text>
          </Pressable>
        ) : null}

        {onSecondary && secondaryLabel ? (
          <Pressable
            onPress={onSecondary}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
            style={styles.secondary}
          >
            <Text
              style={[styles.secondaryText, { color: t.textSecondary }]}
              maxFontSizeMultiplier={1.4}
            >
              {secondaryLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.subtitle, textAlign: 'center' },
  message: { ...typography.caption, textAlign: 'center' },
  actions: {
    marginTop: spacing.md,
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primary: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryText: { ...typography.bodyStrong, fontWeight: '700' },
  secondary: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...typography.captionStrong },
});
