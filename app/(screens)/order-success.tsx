import React from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/providers/ThemeProvider";
import i18n from "@/utils/i18n";

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId, orderNumber } = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success + "20" }]}>
          <Ionicons name="checkmark-circle" size={100} color={colors.success} />
        </View>

        <Heading size="xl" style={[styles.title, { color: colors.text.gray }]}>
          {i18n.t("orderPlaced") || "تم تقديم الطلب بنجاح!"}
        </Heading>

        <Text style={[styles.subtitle, { color: colors.text.veryLightGray }]}>
          {i18n.t("orderPlacedMessage") || "شكراً لك! تم استلام طلبك وهو قيد المعالجة الآن."}
        </Text>

        {orderNumber && (
          <View style={[styles.orderInfo, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.orderLabel, { color: colors.text.veryLightGray }]}>رقم الطلب:</Text>
            <Text style={[styles.orderValue, { color: colors.primary }]}>#{orderNumber}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.primaryButtonText}>{i18n.t("continueShopping") || "العودة للتسوق"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.replace("/order")}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              {i18n.t("myOrders") || "طلباتي"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  title: {
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  orderInfo: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  orderLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  orderValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  primaryButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
