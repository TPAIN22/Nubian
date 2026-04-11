import { memo } from "react";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HomeStore } from "@/api/home.api";
import { navigateToStore } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import i18n from "@/utils/i18n";

export const StoreHighlights = memo(({ stores, colors }: { stores: HomeStore[]; colors: any }) => {
  const { trackEvent } = useTracking();
  if (stores.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.text.gray }]}>
          {i18n.t("home_topStores")}
        </Text>
      </View>
      <FlatList
        horizontal
        data={stores}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              trackEvent('store_open', {
                storeId: item._id,
                screen: 'home',
              });
              navigateToStore(item._id, item);
            }}
          >
            <View style={[styles.storeCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <View style={[styles.storeIconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="storefront" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.storeName, { color: colors.text.gray }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.storeRating}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={[styles.storeRatingText, { color: colors.text.veryLightGray }]}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
              {item.verified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.text.white} />
                  <Text style={[styles.verifiedText, { color: colors.text.white }]}>{i18n.t("home_verified")}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        keyExtractor={(item, index) => `store-${item._id}-${index}`}
      />
    </View>
  );
});
StoreHighlights.displayName = "StoreHighlights";

const styles = StyleSheet.create({
  section: { marginTop: 25 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    textAlign: "center",
  },
  accentBar: { width: 4, height: 22, borderRadius: 2 },
  sectionTitle: { padding: 10, fontSize: 14, fontWeight: "bold", flex: 1, },
  storeCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  storeRatingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
