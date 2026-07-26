import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { useRTL } from "@/hooks/useRTL";
import { radius, spacing, typography, MIN_TOUCH } from "@/theme/tokens";
import type { ProfileRowItem } from "./types";
import { PressableScale } from "./PressableScale";

interface ProfileRowProps {
  item: ProfileRowItem;
  /** Hides the bottom hairline for the final row in a card. */
  isLast: boolean;
}

/** A single settings row: icon chip · title · trailing value / slot · chevron. */
export function ProfileRow({ item, isLast }: ProfileRowProps) {
  const { theme } = useTheme();
  const { rowDirection, chevronForward, textAlign } = useRTL();
  const gold = theme.colors.primary;

  const danger = item.tone === "danger";
  const accent = danger ? theme.colors.error : gold;
  const titleColor = danger ? theme.colors.error : theme.colors.text.title;
  const isInteractive = Boolean(item.onPress);

  return (
    <PressableScale
      onPress={item.onPress}
      scaleTo={isInteractive ? 0.985 : 1}
      accessibilityRole={isInteractive ? "button" : undefined}
      accessibilityLabel={item.title}
      style={[
        styles.row,
        { flexDirection: rowDirection },
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderLight,
        },
      ]}
    >
      <View style={[styles.left, { flexDirection: rowDirection }]}>
        <View style={[styles.iconChip, { backgroundColor: accent + "1A" }]}>
          <Ionicons name={item.icon} size={19} color={accent} />
        </View>
        <Text
          style={[styles.title, { color: titleColor, textAlign }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>

      <View style={[styles.right, { flexDirection: rowDirection }]}>
        {item.rightSlot ? (
          item.rightSlot
        ) : (
          <>
            {item.trailingText ? (
              <Text
                style={[styles.trailing, { color: theme.colors.text.muted }]}
                numberOfLines={1}
              >
                {item.trailingText}
              </Text>
            ) : null}
            {isInteractive && !danger ? (
              <Ionicons
                name={chevronForward}
                size={18}
                color={theme.colors.text.subtle}
              />
            ) : null}
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH + 12,
    gap: spacing.sm,
  },
  left: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
  },
  right: {
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 0,
  },
  iconChip: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    flexShrink: 1,
  },
  trailing: {
    ...typography.bodySmall,
    flexShrink: 1,
  },
});
