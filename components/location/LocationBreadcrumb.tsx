import React from "react";
import { I18nManager, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { spacing, typography, useCheckoutTheme } from "@/components/checkout";

interface Crumb {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}

interface Props {
  crumbs: Crumb[];
}

/**
 * The trail of already-chosen levels (country › city). Renders nothing on the
 * first step. Softly fades in/out as steps change.
 */
export const LocationBreadcrumb = React.memo(function LocationBreadcrumb({
  crumbs,
}: Props) {
  const t = useCheckoutTheme();
  if (crumbs.length === 0) return null;

  const separator = I18nManager.isRTL ? "chevron-back" : "chevron-forward";

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(120)}
      style={styles.row}
    >
      {crumbs.map((crumb, i) => (
        <React.Fragment key={`${crumb.label}-${i}`}>
          {i > 0 ? (
            <Ionicons name={separator} size={12} color={t.textTertiary} />
          ) : null}
          <View
            style={[
              styles.chip,
              { backgroundColor: t.surfaceMuted, borderColor: t.border },
            ]}
          >
            <Ionicons name={crumb.icon} size={12} color={t.accent} />
            <Text
              style={[styles.chipText, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {crumb.label || "—"}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  chipText: { ...typography.caption, fontWeight: "600" },
});
