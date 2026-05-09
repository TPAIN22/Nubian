import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

type Props = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export const EmptyCartState = React.memo(function EmptyCartState({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: Props) {
  const t = useCheckoutTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      style={styles.wrap}
    >
      <View
        style={[
          styles.illustrationWrap,
          { backgroundColor: t.surfaceMuted },
        ]}
      >
        <Ionicons
          name="bag-handle-outline"
          size={56}
          color={t.textTertiary}
        />
        <View
          style={[
            styles.illustrationDot,
            { backgroundColor: t.accent },
          ]}
        />
      </View>

      <Text
        style={[styles.title, { color: t.textPrimary }]}
        numberOfLines={2}
      >
        {title || i18n.t('cartEmpty') || 'Your cart is empty'}
      </Text>
      <Text
        style={[styles.subtitle, { color: t.textTertiary }]}
        numberOfLines={3}
      >
        {subtitle ||
          i18n.t('cartEmptySubtitle') ||
          'Browse the catalog and add items to start your order.'}
      </Text>

      {onCta ? (
        <Pressable
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel || i18n.t('startShopping') || 'Start shopping'}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: t.textPrimary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: t.surface }]}>
            {ctaLabel || i18n.t('startShopping') || 'Start shopping'}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  illustrationWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  illustrationDot: {
    position: 'absolute',
    top: 18,
    right: 22,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: { ...typography.title, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 280,
  },
  cta: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { ...typography.bodyStrong },
});
