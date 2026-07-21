import { StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing } from "@/theme/tokens";

/** "Don't have an account? Sign up" — prompt + inline link on the same line. */
export function AuthLinkRow({
  prompt,
  action,
  onPress,
}: {
  prompt: string;
  action: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Text style={[styles.prompt, { color: colors.text.veryLightGray }]}>
      {prompt}{" "}
      <Text
        style={[styles.link, { color: colors.primary }]}
        onPress={onPress}
        accessibilityRole="link"
      >
        {action}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
