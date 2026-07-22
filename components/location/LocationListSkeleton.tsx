import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton, spacing, useCheckoutTheme } from "@/components/checkout";

interface Props {
  rows?: number;
}

/**
 * Skeleton placeholder that mirrors the LocationListItem layout so the swap to
 * real rows is seamless — no blank space, no layout jump.
 */
export const LocationListSkeleton = React.memo(function LocationListSkeleton({
  rows = 7,
}: Props) {
  const t = useCheckoutTheme();
  return (
    <View style={styles.wrap} accessibilityElementsHidden>
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={[
            styles.row,
            { backgroundColor: t.card, borderColor: t.border },
          ]}
        >
          <Skeleton width={36} height={36} borderRadius={18} />
          <View style={styles.body}>
            {/* Vary widths so the placeholder reads as a list, not a grid. */}
            <Skeleton width={`${68 - (i % 3) * 12}%`} height={13} />
          </View>
          <Skeleton width={16} height={16} borderRadius={8} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.base, paddingTop: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    marginBottom: spacing.sm,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  body: { flex: 1 },
});
