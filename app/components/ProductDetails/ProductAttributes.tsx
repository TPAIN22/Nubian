import { View, StyleSheet, Pressable, I18nManager } from 'react-native';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import type { ProductAttribute, SelectedAttributes } from '@/types/cart.types';
import type { LightColors, DarkColors } from '@/theme';

interface ProductAttributesProps {
  // Legacy support
  sizes?: string[];
  colors?: string[];
  selectedSize?: string | null;
  selectedColor?: string | null;
  onSizeSelect?: (size: string) => void;
  onColorSelect?: (color: string) => void;
  
  // New flexible attributes
  attributes?: ProductAttribute[];
  selectedAttributes: SelectedAttributes;
  onAttributeSelect?: (attrName: string, value: string) => void;
  
  themeColors: LightColors | DarkColors;
}

export const ProductAttributes = ({
  sizes,
  colors: availableColors,
  selectedSize,
  selectedColor,
  onSizeSelect,
  onColorSelect,
  attributes,
  selectedAttributes,
  onAttributeSelect,
  themeColors,
}: ProductAttributesProps) => {
  const renderSizeSelector = () => {
    if (!sizes || sizes.length === 0) return null;
    
    return (
      <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
          {i18n.t('chooseSize') || 'Size'}
        </Text>
        <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
          {sizes.map((size: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.optionBox,
                { 
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.borderLight,
                },
                size === selectedSize && {
                  backgroundColor: themeColors.primary,
                  borderColor: themeColors.primary,
                },
              ]}
              onPress={() => onSizeSelect?.(size)}
              accessibilityLabel={`Select size ${size}`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.optionText,
                  { color: themeColors.text.gray },
                  size === selectedSize && { color: themeColors.text.white },
                ]}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderColorSelector = () => {
    if (!availableColors || availableColors.length === 0) return null;
    
    return (
      <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
          {i18n.t('color') || 'Color'}
        </Text>
        <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
          {availableColors.map((color: string, index: number) => (
            <Pressable
              key={index}
              style={[
                styles.colorSwatch,
                { borderColor: 'transparent' },
                color === selectedColor && { borderColor: themeColors.text.gray },
              ]}
              onPress={() => onColorSelect?.(color)}
              accessibilityLabel={`Select color ${color}`}
              accessibilityRole="button"
            >
              <View style={[styles.colorCircle, { backgroundColor: color, borderColor: themeColors.borderLight }]} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderAttributesSelector = () => {
    if (!attributes || attributes.length === 0) return null;
    
    return (
      <>
        {attributes.map((attr: ProductAttribute) => {
          // Skip if it's size or color (handled separately for legacy support)
          if (attr.name === 'size' || attr.name === 'color') {
            return null;
          }
          
          if (attr.type === 'select' && attr.options && attr.options.length > 0) {
            return (
              <View key={attr.name} style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
                  {attr.displayName || attr.name} {attr.required && '*'}
                </Text>
                <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
                  {attr.options.map((option: string, index: number) => {
                    const isSelected = selectedAttributes[attr.name] === option;
                    return (
                      <Pressable
                        key={index}
                        style={[
                          styles.optionBox,
                          { 
                            backgroundColor: themeColors.cardBackground,
                            borderColor: themeColors.borderLight,
                          },
                          isSelected && {
                            backgroundColor: themeColors.primary,
                            borderColor: themeColors.primary,
                          },
                        ]}
                        onPress={() => onAttributeSelect?.(attr.name, option)}
                        accessibilityLabel={`Select ${attr.displayName || attr.name} ${option}`}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: themeColors.text.gray },
                            isSelected && { color: themeColors.text.white },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          }
          
          return null;
        })}
      </>
    );
  };

  return (
    <>
      {renderSizeSelector()}
      {renderColorSelector()}
      {renderAttributesSelector()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  optionBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
});
