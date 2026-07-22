import React from "react";
import { I18nManager, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import { spacing, typography, useCheckoutTheme } from "@/components/checkout";
import { LocationStepProgress } from "./LocationStepProgress";

interface Props {
  title: string;
  stepIndex: number;
  totalSteps?: number;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Elevated header for the picker sheet: a single leading control that morphs
 * between "close" (first step) and "back" (deeper steps), a centred title, and
 * a step-progress bar beneath. RTL-aware chevrons.
 */
export const LocationPickerHeader = React.memo(function LocationPickerHeader({
  title,
  stepIndex,
  totalSteps = 3,
  canGoBack,
  onBack,
  onClose,
}: Props) {
  const t = useCheckoutTheme();

  const leadingIcon = canGoBack
    ? I18nManager.isRTL
      ? "chevron-forward"
      : "chevron-back"
    : "close";

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={canGoBack ? onBack : onClose}
          accessibilityRole="button"
          accessibilityLabel={
            canGoBack ? i18n.t("back") || "Back" : i18n.t("close") || "Close"
          }
          hitSlop={12}
          style={[styles.btn, { backgroundColor: t.surfaceMuted }]}
        >
          <Ionicons name={leadingIcon} size={18} color={t.textPrimary} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text
            style={[styles.title, { color: t.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.stepLabel, { color: t.textTertiary }]}>
            {`${stepIndex + 1} / ${totalSteps}`}
          </Text>
        </View>

        {/* Spacer to keep the title optically centred against the leading btn. */}
        <View style={styles.btn} />
      </View>

      <View style={styles.progress}>
        <LocationStepProgress index={stepIndex} total={totalSteps} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { ...typography.subtitle, fontSize: 16 },
  stepLabel: { ...typography.label, marginTop: 2, letterSpacing: 0.6 },
  progress: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
