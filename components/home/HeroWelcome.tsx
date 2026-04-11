import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { LinearGradient } from "expo-linear-gradient";
import i18n from "@/utils/i18n";

export const HeroWelcome = memo(({ colors }: { colors: any }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return i18n.t("home_welcomeMorning");
    if (hour < 17) return i18n.t("home_welcomeAfternoon");
    return i18n.t("home_welcomeEvening");
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark || colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroWelcome}
    >
      <View style={styles.heroContent}>
        <Text style={[styles.heroGreeting, { color: colors.text.white }]}>
          {getGreeting()} 👋
        </Text>
        <Text style={[styles.heroMessage, { color: colors.text.white }]}>
          {i18n.t("home_welcomeMessage")}
        </Text>
      </View>
    </LinearGradient>
  );
});
HeroWelcome.displayName = "HeroWelcome";

const styles = StyleSheet.create({
  heroWelcome: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 16,
  },
  heroContent: {
    gap: 4,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: "bold",
  },
  heroMessage: {
    fontSize: 16,
    opacity: 0.9,
  },
});
