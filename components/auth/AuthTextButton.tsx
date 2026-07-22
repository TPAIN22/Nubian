import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing } from "@/theme/tokens";

/**
 * Centered text-only button (e.g. "Resend code", "Change email"). `tone`
 * picks between the primary accent and a muted color.
 */
export function AuthTextButton({
  label,
  onPress,
  disabled = false,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "muted";
}) {
  const { theme } = useTheme();
  const color =
    tone === "primary" ? theme.colors.primary : theme.colors.text.veryLightGray;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={styles.button}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
