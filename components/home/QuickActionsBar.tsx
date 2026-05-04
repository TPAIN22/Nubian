import { memo } from "react";
import { View, FlatList, Pressable, StyleSheet, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  navigateToTrending,
  navigateToFlashDeals,
  navigateToNewArrivals,
} from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import i18n from "@/utils/i18n";

export const QuickActionsBar = memo(({ colors }: { colors: any }) => {
  const { trackEvent } = useTracking();
  const isRTL = I18nManager.isRTL;

  const actions = [
    {
      id: "categories",
      icon: "grid-outline" as const,
      label: i18n.t("home_exploreCategories"),
      onPress: () => router.push("/(tabs)/explore"),
    },
    {
      id: "deals",
      icon: "flash-outline" as const,
      label: i18n.t("home_todaysDeals"),
      onPress: () => navigateToFlashDeals(),
    },
    {
      id: "trending",
      icon: "trending-up-outline" as const,
      label: i18n.t("home_trendingNow"),
      onPress: () => navigateToTrending(),
    },
    {
      id: "new",
      icon: "sparkles-outline" as const,
      label: i18n.t("home_newArrivals"),
      onPress: () => navigateToNewArrivals(),
    },
  ];

  return (
    <View style={styles.quickActionsContainer}>
      <FlatList
        data={actions}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.quickActionsContent,
          isRTL && { flexDirection: "row-reverse" },
        ]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.quickActionItem, { backgroundColor: colors.cardBackground }]}
            onPress={() => {
              trackEvent("quick_action_tap", { action: item.id });
              item.onPress();
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name={item.icon} size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: colors.text.gray }]} numberOfLines={2}>
              {item.label}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
});
QuickActionsBar.displayName = "QuickActionsBar";

const styles = StyleSheet.create({
  quickActionsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionItem: {
    width: 60,
    alignItems: "center",
    padding: 6,
    borderRadius: 6,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "400",
  },
});
