import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";

export const BenefitsBanner = memo(({ colors }: { colors: any }) => {
  const benefits = [
    {
      icon: "car-outline" as const,
      title: i18n.t("home_freeDelivery"),
      desc: i18n.t("home_freeDeliveryDesc"),
    },
    {
      icon: "shield-checkmark-outline" as const,
      title: i18n.t("home_securePayment"),
      desc: i18n.t("home_securePaymentDesc"),
    },
    {
      icon: "ribbon-outline" as const,
      title: i18n.t("home_qualityProducts"),
      desc: i18n.t("home_qualityProductsDesc"),
    },
  ];

  return (
    <View style={[styles.benefitsBanner, { backgroundColor: colors.primary + "08" }]}>
      {benefits.map((benefit, index) => (
        <View key={index} style={styles.benefitItem}>
          <View style={[styles.benefitIconContainer, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name={benefit.icon} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.benefitTitle, { color: colors.text.gray }]}>{benefit.title}</Text>
          <Text style={[styles.benefitDesc, { color: colors.text.veryLightGray }]} numberOfLines={2}>
            {benefit.desc}
          </Text>
        </View>
      ))}
    </View>
  );
});
BenefitsBanner.displayName = "BenefitsBanner";

const styles = StyleSheet.create({
  benefitsBanner: {
    flexDirection: "row",
    marginHorizontal: 6,
    marginTop: 26,
    marginBottom: 16,
    padding: 6,
    borderRadius: 16,
    justifyContent: "space-between",
  },
  benefitItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  benefitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
