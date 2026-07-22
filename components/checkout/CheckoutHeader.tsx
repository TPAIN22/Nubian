import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { useCheckoutTheme } from './theme';
import { spacing, typography } from './tokens';

type Props = {
  title?: string;
  onClose: () => void;
};

/**
 * Checkout screen header — a centered title with a back affordance. Extracted
 * from the checkout orchestrator so the screen file stays focused on flow logic.
 */
export const CheckoutHeader = React.memo(function CheckoutHeader({
  title,
  onClose,
}: Props) {
  const t = useCheckoutTheme();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('close') || 'Close'}
        hitSlop={12}
        style={[styles.headerBtn, { backgroundColor: t.surfaceMuted }]}
      >
        <Ionicons name="chevron-back" size={20} color={t.textPrimary} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
        {title || i18n.t('checkout') || 'Checkout'}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    minHeight: 48,
  },
  headerTitle: { ...typography.title, flex: 1, textAlign: 'center' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
