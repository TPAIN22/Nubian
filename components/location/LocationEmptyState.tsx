import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import { spacing, typography, useCheckoutTheme } from "@/components/checkout";

interface Props {
  /** True when the emptiness is the result of a search query. */
  searching: boolean;
}

/**
 * Friendly empty state — distinguishes "no matches for your search" from
 * "nothing here yet" and offers a gentle hint in the former case.
 */
export const LocationEmptyState = React.memo(function LocationEmptyState({
  searching,
}: Props) {
  const t = useCheckoutTheme();
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: t.surfaceMuted }]}>
        <Ionicons
          name={searching ? "search-outline" : "map-outline"}
          size={26}
          color={t.textTertiary}
        />
      </View>
      <Text style={[styles.title, { color: t.textPrimary }]}>
        {searching
          ? i18n.t("location_noResults") || "No matches"
          : i18n.t("location_noData") || "Nothing here yet"}
      </Text>
      {searching ? (
        <Text style={[styles.hint, { color: t.textTertiary }]}>
          {i18n.t("location_noResultsHint") ||
            "Try a different spelling or a shorter query."}
        </Text>
      ) : null}
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
  hint: { ...typography.caption, textAlign: "center", maxWidth: 250 },
});
