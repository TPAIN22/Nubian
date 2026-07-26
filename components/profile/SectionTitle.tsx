import { StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { useRTL } from "@/hooks/useRTL";
import { spacing, typography } from "@/theme/tokens";

/** Small uppercase caption that labels a group of cards. */
export function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  const { textAlign } = useRTL();

  return (
    <Text
      style={[styles.title, { color: theme.colors.text.muted, textAlign }]}
    >
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.label,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
