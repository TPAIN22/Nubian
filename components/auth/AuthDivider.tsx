import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import i18n from "@/utils/i18n";
import { spacing } from "@/theme/tokens";

/** "or" divider between OAuth providers and the email form. */
export function AuthDivider() {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
      <Text style={[styles.text, { color: colors.text.veryLightGray }]}>
        {i18n.t("or") || "or"}
      </Text>
      <View style={[styles.line, { backgroundColor: colors.borderLight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  text: {
    paddingHorizontal: spacing.md,
    fontSize: 13,
  },
});
