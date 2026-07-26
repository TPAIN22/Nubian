import { memo, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "@/components/ui/kit";
import { iconSize, radius, SCREEN_PADDING, spacing, withAlpha } from "@/theme/tokens";
import i18n from "@/utils/i18n";

/**
 * Countdown strip under the flash-deals header.
 *
 * Urgency now uses the `sale` colour rather than `warning`: an amber bar reads
 * as a caution message, a red-pink one reads as a deal ending. The digits sit
 * in fixed-width dark tiles so the row doesn't jitter as the seconds tick —
 * the old variable-width boxes visibly nudged the layout every second.
 */
export const FlashDealsCountdown = memo(({ colors }: { colors: any }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderUnit = (value: number) => (
    <View style={[styles.unit, { backgroundColor: colors.sale }]}>
      <AppText variant="captionStrong" weight="800" style={styles.unitText}>
        {String(value).padStart(2, "0")}
      </AppText>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: withAlpha(colors.sale, 0.1) }]}
      accessibilityLabel={`${i18n.t("home_flashDealsEndsIn")} ${timeLeft.hours} hours ${timeLeft.minutes} minutes`}
    >
      <Ionicons name="flash" size={iconSize.sm} color={colors.sale} />
      <AppText variant="captionStrong" style={{ color: colors.sale, flex: 1 }} numberOfLines={1}>
        {i18n.t("home_flashDealsEndsIn")}
      </AppText>

      <View style={styles.timers} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {renderUnit(timeLeft.hours)}
        <AppText variant="captionStrong" style={{ color: colors.sale }}>:</AppText>
        {renderUnit(timeLeft.minutes)}
        <AppText variant="captionStrong" style={{ color: colors.sale }}>:</AppText>
        {renderUnit(timeLeft.seconds)}
      </View>
    </View>
  );
});
FlashDealsCountdown.displayName = "FlashDealsCountdown";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SCREEN_PADDING,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  timers: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  unit: {
    // Fixed width: two monospaced-ish digits never resize the row mid-tick.
    minWidth: 34,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.xs,
    alignItems: "center",
  },
  unitText: { color: "#FFFFFF" },
});
