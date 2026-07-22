import React, { useState } from "react";
import { I18nManager, Pressable, StyleSheet, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { radius, spacing, useCheckoutTheme } from "@/components/checkout";

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
}

/**
 * Premium search field. Border/soft-glow lifts on focus; a clear affordance
 * appears once there's a query. Layout mirrors for RTL.
 */
export const LocationSearchBar = React.memo(function LocationSearchBar({
  value,
  onChange,
  placeholder,
}: Props) {
  const t = useCheckoutTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: t.surfaceMuted,
          borderColor: focused ? t.accent : t.border,
          borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      <Ionicons
        name="search"
        size={16}
        color={focused ? t.accent : t.textTertiary}
      />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={t.textTertiary}
        style={[
          styles.input,
          {
            color: t.textPrimary,
            textAlign: I18nManager.isRTL ? "right" : "left",
          },
        ]}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
      />
      {value ? (
        <Pressable
          onPress={() => onChange("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("clear") || "Clear"}
        >
          <Ionicons name="close-circle" size={16} color={t.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.input,
  },
  input: { flex: 1, fontSize: 15, fontWeight: "500", padding: 0 },
});
