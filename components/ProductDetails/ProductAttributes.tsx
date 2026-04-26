import { View, StyleSheet, Pressable, I18nManager } from 'react-native';
import { Text } from '@/components/ui/text';
import { useMemo, memo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { SelectedAttributes } from '@/domain/product/product.selectors';
import {
  normalizeSelectedAttributes,
  getAttributeOptions,
  isOptionAvailable,
} from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import type { LightColors, DarkColors } from '@/theme';

interface PillProps {
  label: string;
  isSelected: boolean;
  isAvailable: boolean;
  onPress: () => void;
  colors: LightColors | DarkColors;
}

const VariantPill = memo(({ label, isSelected, isAvailable, onPress, colors }: PillProps) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isAvailable) return;
    scale.value = withSpring(0.93, { damping: 12, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            borderColor: colors.borderMedium,
            backgroundColor: colors.cardBackground,
          },
          isSelected && {
            backgroundColor: colors.text.gray,
            borderColor: colors.text.gray,
          },
          !isAvailable && !isSelected && styles.pillUnavailable,
          animStyle,
        ]}
      >
        {!isAvailable && !isSelected && (
          <View style={[styles.strikethrough, { backgroundColor: colors.text.lightGray }]} />
        )}
        <Text
          style={[
            styles.pillText,
            { color: colors.text.gray },
            isSelected && { color: colors.text.white },
            !isAvailable && !isSelected && { color: colors.text.veryLightGray },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});
VariantPill.displayName = 'VariantPill';

interface Props {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  onAttributeSelect: (attrName: string, value: string) => void;
  themeColors: LightColors | DarkColors;
  pleaseSelectText?: string;
}

export const ProductAttributes = memo(
  ({ product, selectedAttributes, onAttributeSelect, themeColors, pleaseSelectText = 'Please select' }: Props) => {
    const optionsMap = useMemo(() => getAttributeOptions(product), [product]);

    const attrsList = useMemo(() => {
      if (product.attributeDefs && product.attributeDefs.length > 0) {
        return product.attributeDefs;
      }
      return Object.keys(optionsMap).map(key => ({
        name: key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1),
        required: true,
      }));
    }, [product.attributeDefs, optionsMap]);

    const normalizedSelected = useMemo(
      () => normalizeSelectedAttributes(selectedAttributes),
      [selectedAttributes]
    );

    if (!attrsList.length) return null;

    return (
      <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
        {attrsList.map((attr, idx) => {
          const key = String(attr.name ?? '').trim().toLowerCase();
          if (!key) return null;

          const options = optionsMap[key] ?? [];
          const current = normalizedSelected[key] ?? '';
          const required = (attr as any).required === true;

          if (options.length === 0) return null;

          return (
            <View key={`${key}-${idx}`} style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={[styles.attrLabel, { color: themeColors.text.gray }]}>
                  {(attr.displayName || attr.name).toUpperCase()}
                </Text>
                {current ? (
                  <Text style={[styles.selectedValue, { color: themeColors.primary }]}>
                    {current}
                  </Text>
                ) : required ? (
                  <Text style={[styles.hintText, { color: themeColors.text.veryLightGray }]}>
                    {pleaseSelectText}
                  </Text>
                ) : null}
              </View>

              <View style={[styles.pillRow, I18nManager.isRTL && styles.pillRowRTL]}>
                {options.map((opt: string) => (
                  <VariantPill
                    key={`${key}-${opt}`}
                    label={opt}
                    isSelected={current === opt}
                    isAvailable={isOptionAvailable(product, key, opt, normalizedSelected)}
                    onPress={() => onAttributeSelect(key, opt)}
                    colors={themeColors}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  }
);
ProductAttributes.displayName = 'ProductAttributes';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attrLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  selectedValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillRowRTL: {
    flexDirection: 'row-reverse',
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1.5,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pillUnavailable: {
    opacity: 0.35,
  },
  strikethrough: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 1,
    top: '50%',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
