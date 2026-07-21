import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { radius, spacing, typography } from "@/theme/tokens";
import type { StatItem } from "./types";
import { PressableScale } from "./PressableScale";

/** A horizontal band of headline stat cards (Orders / Wishlist / Addresses). */
export function ProfileStats({ stats }: { stats: StatItem[] }) {
  const { theme, isDark } = useTheme();
  const gold = theme.colors.primary;

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <PressableScale
          key={stat.key}
          onPress={stat.onPress}
          accessibilityRole="button"
          accessibilityLabel={`${stat.value} ${stat.label}`}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.borderLight,
            },
            isDark ? styles.borderDark : styles.shadowLight,
          ]}
        >
          <View style={[styles.iconChip, { backgroundColor: gold + "1A" }]}>
            <Ionicons name={stat.icon} size={18} color={gold} />
          </View>
          <Text style={[styles.value, { color: theme.colors.text.gray }]}>
            {stat.value}
          </Text>
          <Text
            style={[styles.label, { color: theme.colors.text.veryLightGray }]}
            numberOfLines={1}
          >
            {stat.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flex: 1,
    alignItems: "center",
    borderRadius: radius.card,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  borderDark: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadowLight: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  value: {
    ...typography.title,
    fontSize: 20,
  },
  label: {
    ...typography.caption,
    fontWeight: "500",
  },
});
