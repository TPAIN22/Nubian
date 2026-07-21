import { Linking, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import i18n from "@/utils/i18n";
import { spacing, typography } from "@/theme/tokens";

const TERMS_URL = "https://nubian-sd.com/terms-and-conditions";
const PRIVACY_URL = "https://nubian-sd.com/privacy-policy";

/**
 * "By continuing you agree to our Terms and Privacy Policy" footer with links.
 * `leadKey` lets signin/signup use their own intro copy.
 */
export function TermsFooter({ leadKey = "bySigningUpAgree" }: { leadKey?: string }) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Text style={[styles.terms, { color: colors.text.veryLightGray }]}>
      {i18n.t(leadKey)}{" "}
      <Text
        style={[styles.link, { color: colors.primary }]}
        onPress={() => Linking.openURL(TERMS_URL)}
      >
        {i18n.t("termsAndConditions")}
      </Text>{" "}
      {i18n.t("and")}{" "}
      <Text
        style={[styles.link, { color: colors.primary }]}
        onPress={() => Linking.openURL(PRIVACY_URL)}
      >
        {i18n.t("privacyPolicy")}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  terms: {
    ...typography.caption,
    textAlign: "center",
    paddingHorizontal: spacing.base,
  },
  link: {
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
