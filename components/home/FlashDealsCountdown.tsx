import React, { memo, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";

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

  return (
    <View style={[styles.countdownContainer, { backgroundColor: colors.warning + "15" }]}>
      <Ionicons name="time-outline" size={18} color={colors.warning} />
      <Text style={[styles.countdownLabel, { color: colors.warning }]}>
        {i18n.t("home_flashDealsEndsIn")}:
      </Text>
      <View style={styles.countdownTimers}>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.hours).padStart(2, "0")}</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: colors.warning }]}>:</Text>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.minutes).padStart(2, "0")}</Text>
        </View>
        <Text style={[styles.countdownSeparator, { color: colors.warning }]}>:</Text>
        <View style={[styles.countdownBox, { backgroundColor: colors.warning }]}>
          <Text style={styles.countdownNumber}>{String(timeLeft.seconds).padStart(2, "0")}</Text>
        </View>
      </View>
    </View>
  );
});
FlashDealsCountdown.displayName = "FlashDealsCountdown";

const styles = StyleSheet.create({
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 8,
    borderRadius: 12,
    gap: 8,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  countdownTimers: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 4,
  },
  countdownBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 40,
  },
  countdownNumber: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
  },
  countdownSeparator: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
