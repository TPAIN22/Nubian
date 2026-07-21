import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { radius, spacing, typography } from "@/theme/tokens";
import type { QuickActionItem } from "./types";
import { Surface } from "./Surface";
import { PressableScale } from "./PressableScale";

/**
 * A two-column grid of fast-access tiles inside a single card. Each tile has a
 * tinted icon chip and a label, and scales subtly on press.
 */
export function QuickActions({ actions }: { actions: QuickActionItem[] }) {
  const { theme } = useTheme();
  const gold = theme.colors.primary;

  return (
    <Surface style={styles.grid}>
      {actions.map((action) => (
        <PressableScale
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          style={styles.tile}
        >
          <View style={[styles.iconChip, { backgroundColor: gold + "1A" }]}>
            <Ionicons name={action.icon} size={24} color={gold} />
          </View>
          <Text
            style={[styles.label, { color: theme.colors.text.gray }]}
            numberOfLines={1}
          >
            {action.title}
          </Text>
        </PressableScale>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.sm,
  },
  tile: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  iconChip: {
    width: 52,
    height: 52,
    borderRadius: radius.card,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.captionStrong,
    fontSize: 14,
    textAlign: "center",
  },
});
