import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { useRTL } from "@/hooks/useRTL";
import { radius, spacing, typography } from "@/theme/tokens";

type Props = TextInputProps & {
  /** Optional uppercase label rendered above the field. */
  label?: string;
  /** Center the text (used for the verification code input). */
  centered?: boolean;
};

/**
 * Themed text input for the auth screens. Uses `background` (not `surface`) so
 * the field reads clearly against the card, flips alignment for RTL, and shows
 * a primary-colored border on focus.
 */
export function AuthTextField({ label, centered, style, ...props }: Props) {
  const { theme } = useTheme();
  const rtl = useRTL();
  const colors = theme.colors;
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: colors.text.veryLightGray }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.text.veryLightGray}
        textAlign={centered ? "center" : rtl.textAlign}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            color: colors.text.gray,
            borderColor: focused ? colors.primary : colors.borderLight,
          },
          centered && styles.centered,
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    textTransform: "uppercase",
    paddingHorizontal: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    fontSize: 16,
  },
  centered: {
    letterSpacing: 4,
    fontSize: 18,
    fontWeight: "600",
  },
});
