import React from "react";
import {
  StyleSheet,
  View,
  // Plain RN Text for the label on the colored retry fill — the themed <Text>
  // forces a NativeWind className color that overrides inline color.
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import {
  PressableScale,
  radius,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";

interface Props {
  message?: string | null;
  onRetry: () => void;
}

/**
 * Polished error card shown when a country/city/area load fails. Surfaces the
 * store's existing `error` and re-runs the current step's loader on retry — no
 * new logic, just a face for a state the old UI ignored.
 */
export const LocationErrorState = React.memo(function LocationErrorState({
  message,
  onRetry,
}: Props) {
  const t = useCheckoutTheme();
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: t.errorSoft }]}>
        <Ionicons name="cloud-offline-outline" size={26} color={t.error} />
      </View>
      <Text style={[styles.title, { color: t.textPrimary }]}>
        {i18n.t("location_loadError") || "Couldn’t load locations"}
      </Text>
      <Text style={[styles.hint, { color: t.textTertiary }]} numberOfLines={3}>
        {message ||
          i18n.t("location_loadErrorHint") ||
          "Check your connection and try again."}
      </Text>

      <PressableScale
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("retry") || "Try again"}
        style={[styles.retry, { backgroundColor: t.accent }]}
      >
        <Ionicons name="refresh" size={16} color={t.textInverse} />
        <RNText style={[styles.retryText, { color: t.textInverse }]}>
          {i18n.t("retry") || "Try again"}
        </RNText>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: { ...typography.bodyStrong, textAlign: "center" },
  hint: { ...typography.caption, textAlign: "center", maxWidth: 260 },
  retry: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    marginTop: spacing.md,
  },
  retryText: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
});
