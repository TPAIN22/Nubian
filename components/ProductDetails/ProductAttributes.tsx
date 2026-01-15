import { useMemo } from "react";
import { View, StyleSheet, Pressable, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import type { SelectedAttributes } from "@/domain/product/product.selectors";
import { normalizeSelectedAttributes, getAttributeOptions, isOptionAvailable } from "@/domain/product/product.selectors";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import type { LightColors, DarkColors } from "@/theme";

interface Props {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  onAttributeSelect: (attrName: string, value: string) => void;
  themeColors: LightColors | DarkColors;
  pleaseSelectText?: string;
}

export const ProductAttributes = ({
  product,
  selectedAttributes,
  onAttributeSelect,
  themeColors,
  pleaseSelectText = "Please select",
}: Props) => {
  const attrsList = product.attributeDefs ?? [];
  const normalizedSelected = useMemo(() => normalizeSelectedAttributes(selectedAttributes), [selectedAttributes]);
  const optionsMap = useMemo(() => getAttributeOptions(product), [product]);

  if (!attrsList.length) return null;

  return (
    <>
      {attrsList.map((attr, idx) => {
        const keyLower = String(attr.name ?? "").trim().toLowerCase();
        if (!keyLower) return null;

        // Backend-driven options only (attributeDefs.options or derived from selectable variants)
        const options = optionsMap[keyLower] ?? [];

        const currentValue = normalizedSelected[keyLower] ?? "";
        const required = (attr as any).required === true;
        const showMissing = required && !currentValue;

        return (
          <View
            key={`${keyLower}-${idx}`}
            style={[styles.container, { backgroundColor: themeColors.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: themeColors.text.gray }]}>
              {attr.displayName || attr.name} {required ? "*" : ""}
            </Text>

            {showMissing ? (
              <Text style={[styles.hint, { color: themeColors.error }]}>
                {pleaseSelectText}: {attr.displayName || attr.name}
              </Text>
            ) : null}

            {options.length === 0 ? (
              <Text style={[styles.hint, { color: themeColors.text.veryLightGray }]}>
                {`No options found for "${keyLower}"`}
              </Text>
            ) : (
              <View style={[styles.row, I18nManager.isRTL && styles.rowRTL]}>
                {options.map((option: string) => {
                  const opt = String(option);
                  const isSelected = currentValue === opt;
                  const isAvailable = isOptionAvailable(product, keyLower, opt, normalizedSelected);

                  return (
                    <Pressable
                      key={`${keyLower}-${opt}`}
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
                        !isAvailable && !isSelected && {
                          opacity: 0.3,
                          borderColor: themeColors.borderLight,
                          backgroundColor: themeColors.surface,
                        },
                      ]}
                      onPress={() => isAvailable && onAttributeSelect(keyLower, opt)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected, disabled: !isAvailable }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: themeColors.text.gray },
                          isSelected && { color: themeColors.text.white },
                          !isAvailable && !isSelected && { color: themeColors.text.veryLightGray },
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  hint: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  rowRTL: { flexDirection: "row-reverse" },
  optionBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: "center",
  },
  optionText: { fontSize: 14, fontWeight: "600" },
});
