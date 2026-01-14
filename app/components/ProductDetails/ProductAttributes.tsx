import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import type { ProductAttribute, SelectedAttributes } from "@/types/cart.types";
import type { LightColors, DarkColors } from "@/theme";
import { normalizeAttributes } from "@/utils/cartUtils";

type VariantLike = {
  attributes?: any; // Record | Map | unknown
  isActive?: boolean;
  stock?: number;
};

type ProductLike = {
  sizes?: string[];
  colors?: string[];
  variants?: VariantLike[];
};

interface Props {
  product?: ProductLike | null;
  attributes?: ProductAttribute[];
  selectedAttributes: SelectedAttributes;
  onAttributeSelect: (attrName: string, value: string) => void;
  themeColors: LightColors | DarkColors;
  optionsMap?: Record<string, string[]>;
  pleaseSelectText?: string;
}

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

const attrsToObject = (attrs: any): Record<string, string> => {
  if (!attrs) return {};
  if (attrs instanceof Map) return Object.fromEntries(attrs.entries());
  if (Array.isArray(attrs)) {
    // support odd shapes: [{key:'size', value:'S'}]
    const o: Record<string, string> = {};
    for (const it of attrs) {
      if (it?.key && it?.value) o[String(it.key)] = String(it.value);
    }
    return o;
  }
  if (typeof attrs === "object") return attrs as Record<string, string>;
  return {};
};

export const ProductAttributes = ({
  product,
  attributes,
  selectedAttributes,
  onAttributeSelect,
  themeColors,
  optionsMap = {},
  pleaseSelectText = "Please select",
}: Props) => {
  if (!attributes?.length) return null;

  const normalizedSelected = useMemo(
    () => normalizeAttributes(selectedAttributes),
    [selectedAttributes]
  );

  // ✅ derive options from variants
  const derivedFromVariants = useMemo(() => {
    const out: Record<string, string[]> = {};
    const variants = Array.isArray((product as any)?.variants) ? (product as any).variants : [];

    for (const v of variants) {
      if (v?.isActive === false) continue;
      const obj = attrsToObject(v?.attributes);

      for (const [k, val] of Object.entries(obj)) {
        const key = String(k).trim().toLowerCase();
        if (!key) continue;
        out[key] = out[key] ? [...out[key], String(val)] : [String(val)];
      }
    }

    for (const k of Object.keys(out)) out[k] = uniq(out[k] || []).sort();
    return out;
  }, [product]);

  // ✅ legacy fallback (sizes/colors on product)
  const legacyOptions = useMemo(() => {
    return {
      size: uniq(Array.isArray((product as any)?.sizes) ? (product as any).sizes : []),
      color: uniq(Array.isArray((product as any)?.colors) ? (product as any).colors : []),
    };
  }, [product]);

  return (
    <>
      {attributes.map((attr, idx) => {
        const keyLower = String(attr.name ?? "").trim().toLowerCase();
        if (!keyLower) return null;

        const attrOptions = Array.isArray((attr as any).options) ? (attr as any).options : [];

        // ✅ options priority:
        // 1) attr.options
        // 2) optionsMap
        // 3) derived from variants
        // 4) legacy sizes/colors
        const options =
          (attrOptions.length ? attrOptions : null) ??
          (optionsMap[keyLower]?.length ? optionsMap[keyLower] : null) ??
          (derivedFromVariants[keyLower]?.length ? derivedFromVariants[keyLower] : null) ??
          ((legacyOptions as any)[keyLower]?.length ? (legacyOptions as any)[keyLower] : []);

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
                      ]}
                      onPress={() => onAttributeSelect(keyLower, opt)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: themeColors.text.gray },
                          isSelected && { color: themeColors.text.white },
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
