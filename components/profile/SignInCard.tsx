import {
  StyleSheet,
  View,
  Platform,
  // Plain RN Text ONLY for the label on the gold button (themed <Text> overrides
  // inline color and would hide it on the fill).
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { radius, spacing, typography } from "@/theme/tokens";
import { lightColors } from "@/theme/colors.light";
import { Surface } from "./Surface";
import { PressableScale } from "./PressableScale";

const ON_GOLD = lightColors.onPrimary;

interface SignInCardProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
}

/** Signed-out state — an inviting card prompting the user to sign in. */
export function SignInCard({
  title,
  subtitle,
  buttonLabel,
  onPress,
}: SignInCardProps) {
  const { theme } = useTheme();
  const gold = theme.colors.primary;

  return (
    <Surface style={styles.card}>
      <View style={[styles.icon, { backgroundColor: gold + "1A" }]}>
        <Ionicons name="person-outline" size={30} color={gold} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text.gray }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.veryLightGray }]}>
        {subtitle}
      </Text>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        style={[styles.button, { backgroundColor: gold }]}
      >
        <Ionicons name="log-in-outline" size={20} color={ON_GOLD} />
        <RNText style={styles.buttonText}>{buttonLabel}</RNText>
      </PressableScale>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    width: "100%",
    minHeight: 54,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.button,
  },
  buttonText: {
    color: ON_GOLD,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: Platform.OS === "web" ? undefined : "Cairo-Bold",
  },
});
