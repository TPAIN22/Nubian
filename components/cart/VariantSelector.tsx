/**
 * `VariantSelector` — presentational variant/attribute picker.
 *
 * Pure UI. Which options exist, which are available and what a selection means
 * are all decided upstream by `domain/product/product.selectors` — this
 * component only renders the groups it is handed and reports taps.
 *
 * What changed visually:
 *  • Selected options are filled with the brand accent *and* carry a check
 *    glyph, so selection is never signalled by colour alone.
 *  • Unavailable options keep the strike-through but are now properly
 *    `disabled` and announced as such, instead of being pressable no-ops.
 *  • Pills are ≥44pt tall.
 *  • A required group with nothing chosen can be highlighted (`highlightMissing`)
 *    once the customer has actually tried to add — the details screen already
 *    tracks that as `cartAttempted`.
 */

import React, { useCallback } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useCheckoutTheme } from '@/components/checkout/theme';
import { MIN_TOUCH, spacing, typography } from '@/theme/tokens';

import { cartStrings as S } from './strings';
import { stepHaptic } from './haptics';

export type VariantOption = { value: string; available: boolean };

export type VariantGroup = {
  /** Normalized attribute key (`size`, `color`, …). */
  key: string;
  /** Human label, already resolved by the caller. */
  label: string;
  required: boolean;
  selected: string;
  options: VariantOption[];
};

type Props = {
  groups: VariantGroup[];
  onSelect: (key: string, value: string) => void;
  /** Ring required-but-empty groups in the error colour. */
  highlightMissing?: boolean;
  pleaseSelectText?: string;
};

const SPRING = { damping: 14, stiffness: 320, mass: 0.5 };

export const VariantSelector = React.memo(function VariantSelector({
  groups,
  onSelect,
  highlightMissing = false,
  pleaseSelectText,
}: Props) {
  const t = useCheckoutTheme();

  if (!groups.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: t.card }]}>
      {groups.map(group => {
        const missing = highlightMissing && group.required && !group.selected;

        return (
          <View key={group.key} style={styles.section}>
            <View style={styles.labelRow}>
              <Text
                style={[styles.groupLabel, { color: t.textSecondary }]}
                maxFontSizeMultiplier={1.4}
              >
                {group.label.toUpperCase()}
                {group.required ? (
                  <Text style={{ color: t.error }}> *</Text>
                ) : null}
              </Text>

              {group.selected ? (
                <Text
                  style={[styles.selectedValue, { color: t.textPrimary }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {group.selected}
                </Text>
              ) : group.required ? (
                <Text
                  style={[
                    styles.hintText,
                    { color: missing ? t.error : t.textTertiary },
                  ]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                >
                  {pleaseSelectText ?? S.pleaseSelect()}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.pillRow,
                I18nManager.isRTL && styles.pillRowRTL,
                missing && [styles.missingWrap, { borderColor: t.error }],
              ]}
              accessibilityRole="radiogroup"
              accessibilityLabel={group.label}
            >
              {group.options.map(option => (
                <VariantPill
                  key={`${group.key}-${option.value}`}
                  label={option.value}
                  groupLabel={group.label}
                  isSelected={group.selected === option.value}
                  isAvailable={option.available}
                  onPress={() => onSelect(group.key, option.value)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const VariantPill = React.memo(function VariantPill({
  label,
  groupLabel,
  isSelected,
  isAvailable,
  onPress,
}: {
  label: string;
  groupLabel: string;
  isSelected: boolean;
  isAvailable: boolean;
  onPress: () => void;
}) {
  const t = useCheckoutTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (!isAvailable) return;
    stepHaptic();
    if (!reduceMotion) {
      scale.value = withSpring(0.93, SPRING, () => {
        scale.value = withSpring(1, SPRING);
      });
    }
    onPress();
  }, [isAvailable, onPress, reduceMotion, scale]);

  // Unavailable *and* selected stays visible (the customer picked it before it
  // sold out) — it must not be silently hidden or greyed to illegibility.
  const dimmed = !isAvailable && !isSelected;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!isAvailable}
      accessibilityRole="radio"
      accessibilityLabel={`${groupLabel}: ${label}`}
      accessibilityHint={
        isAvailable ? undefined : S.unavailableCombination()
      }
      accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            borderColor: isSelected ? t.accent : t.border,
            backgroundColor: isSelected ? t.accent : t.card,
          },
          dimmed && styles.pillUnavailable,
          animStyle,
        ]}
      >
        {dimmed ? (
          <View
            style={[styles.strikethrough, { backgroundColor: t.textTertiary }]}
          />
        ) : null}

        {isSelected ? (
          <Ionicons
            name="checkmark"
            size={13}
            color={t.textInverse}
            style={styles.checkGlyph}
          />
        ) : null}

        <Text
          style={[
            styles.pillText,
            { color: isSelected ? t.textInverse : t.textPrimary },
            dimmed && { color: t.textTertiary },
          ]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  section: { marginBottom: spacing.xl },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  groupLabel: { ...typography.label, letterSpacing: 1.2, fontWeight: '700' },
  selectedValue: { ...typography.captionStrong, flexShrink: 1 },
  hintText: { ...typography.caption, fontStyle: 'italic', flexShrink: 1 },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillRowRTL: { flexDirection: 'row-reverse' },
  missingWrap: {
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: 'dashed',
    padding: spacing.sm,
    margin: -spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 18,
    minHeight: MIN_TOUCH,
    minWidth: 58,
    borderRadius: 100,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  pillUnavailable: { opacity: 0.45 },
  strikethrough: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 1,
    top: '50%',
  },
  checkGlyph: { marginRight: -1 },
  pillText: { ...typography.captionStrong, fontSize: 14 },
});
