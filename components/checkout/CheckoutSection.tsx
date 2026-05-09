import React, { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from './theme';
import { radius, spacing, typography } from './tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  title: string;
  step?: number;
  caption?: string;
  trailing?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (next: boolean) => void;
  complete?: boolean;
  children: React.ReactNode;
};

export const CheckoutSection = React.memo(function CheckoutSection({
  title,
  step,
  caption,
  trailing,
  collapsible = false,
  defaultOpen = true,
  open: controlledOpen,
  onToggle,
  complete,
  children,
}: Props) {
  const t = useCheckoutTheme();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;
  const chevron = useSharedValue(isOpen ? 0 : -90);

  const toggle = useCallback(() => {
    if (!collapsible) return;
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: 'easeInEaseOut' },
      create: { type: 'easeInEaseOut', property: 'opacity' },
    });
    const next = !isOpen;
    chevron.value = withTiming(next ? 0 : -90, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    if (controlledOpen === undefined) setInternalOpen(next);
    onToggle?.(next);
  }, [chevron, collapsible, controlledOpen, isOpen, onToggle]);

  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevron.value}deg` }],
  }));

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: t.border },
      ]}
    >
      <Pressable
        onPress={toggle}
        disabled={!collapsible}
        accessibilityRole={collapsible ? 'button' : 'header'}
        accessibilityLabel={title}
        accessibilityState={collapsible ? { expanded: isOpen } : undefined}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          {step != null ? (
            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: complete ? t.accent : t.surfaceMuted,
                  borderColor: complete ? t.accent : t.border,
                },
              ]}
            >
              {complete ? (
                <Ionicons name="checkmark" size={14} color={t.textInverse} />
              ) : (
                <Text
                  style={[
                    styles.stepText,
                    { color: t.textSecondary },
                  ]}
                >
                  {step}
                </Text>
              )}
            </View>
          ) : null}
          <View style={{ flexShrink: 1 }}>
            <Text
              style={[styles.title, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {caption ? (
              <Text
                style={[styles.caption, { color: t.textTertiary }]}
                numberOfLines={1}
              >
                {caption}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRight}>
          {trailing}
          {collapsible ? (
            <Animated.View style={chevStyle}>
              <Ionicons
                name="chevron-down"
                size={18}
                color={t.textTertiary}
              />
            </Animated.View>
          ) : null}
        </View>
      </Pressable>

      {isOpen ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    minHeight: 56,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { ...typography.captionStrong },
  title: { ...typography.subtitle },
  caption: { ...typography.caption, marginTop: 2 },
  body: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
});
