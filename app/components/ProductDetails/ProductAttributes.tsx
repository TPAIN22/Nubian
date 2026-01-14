import { View, StyleSheet, Pressable, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import type { ProductAttribute, SelectedAttributes } from "@/types/cart.types";
import type { LightColors, DarkColors } from "@/theme";

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

const normalizeKey = (k: string) => (k || "").trim(); // مهم: نفس مفتاح الـ DB بالضبط

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
  const hasLegacySizes = Array.isArray(sizes) && sizes.length > 0;
  const hasLegacyColors = Array.isArray(availableColors) && availableColors.length > 0;

  const renderSizeSelector = () => {
    if (!hasLegacySizes) return null;

    return (
      <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
          {i18n.t("chooseSize") || "Size"}
        </Text>

        <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
          {sizes!.map((size, index) => {
            const isSelected = size === selectedSize || selectedAttributes.size === size;

            return (
              <Pressable
                key={`${size}-${index}`}
                style={[
                  styles.optionBox,
                  { backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderLight },
                  isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                ]}
                onPress={() => {
                  onSizeSelect?.(size);
                  // ✅ توحيد المصدر: دا أهم سطر
                  onAttributeSelect?.("size", size);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: themeColors.text.gray },
                    isSelected && { color: themeColors.text.white },
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderColorSelector = () => {
    if (!hasLegacyColors) return null;

    return (
      <View style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
          {i18n.t("color") || "Color"}
        </Text>

        <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
          {availableColors!.map((color, index) => {
            const isSelected = color === selectedColor || selectedAttributes.color === color;

            return (
              <Pressable
                key={`${color}-${index}`}
                style={[
                  styles.colorSwatch,
                  { borderColor: "transparent" },
                  isSelected && { borderColor: themeColors.text.gray },
                ]}
                onPress={() => {
                  onColorSelect?.(color);
                  // ✅ توحيد المصدر
                  onAttributeSelect?.("color", color);
                }}
              >
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color, borderColor: themeColors.borderLight },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAttributesSelector = () => {
    if (!attributes || attributes.length === 0) return null;

    return (
      <>
        {attributes.map((attr) => {
          const key = normalizeKey(attr.name);

          // ✅ ما تعمل skip للـ size/color إلا إذا أنت بتعرضهم legacy فعلاً
          if (key === "size" && hasLegacySizes) return null;
          if (key === "color" && hasLegacyColors) return null;

          // ما نعرضش attributes مالها options
          const options = Array.isArray(attr.options) ? attr.options : [];
          if (options.length === 0) return null;

          return (
            <View key={key} style={[styles.container, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
                {attr.displayName || key} {attr.required && "*"}
              </Text>

              <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
                {options.map((option, index) => {
                  const isSelected = selectedAttributes[key] === option;

                  return (
                    <Pressable
                      key={`${option}-${index}`}
                      style={[
                        styles.optionBox,
                        { backgroundColor: themeColors.cardBackground, borderColor: themeColors.borderLight },
                        isSelected && { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
                      ]}
                      onPress={() => onAttributeSelect?.(key, option)}
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
  container: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  rowRTL: { flexDirection: "row-reverse" },
  optionBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: "center",
  },
  optionText: { fontSize: 14, fontWeight: "600" },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
});
