import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { radius, spacing } from "@/theme/tokens";

/**
 * Elevated form card — the container the auth forms live in. Matches the
 * cart/checkout card pattern (cardBackground on the surface page, hairline
 * border, rounded corners, subtle shadow).
 */
export function AuthCard({ style, children, ...props }: ViewProps) {
  const { theme, isDark } = useTheme();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.borderLight,
        },
        isDark ? styles.borderDark : styles.shadowLight,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
  },
  borderDark: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadowLight: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
});
