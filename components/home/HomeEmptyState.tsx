import { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";

export const HomeEmptyState = memo(({ colors, onRefresh }: { colors: any, onRefresh: () => void }) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="bag-handle-outline" size={80} color={colors.primary} />
        <View style={[styles.emptyIconBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="refresh" size={18} color="white" />
        </View>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text.gray }]}>
        {i18n.t("home_empty_title")}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text.veryLightGray }]}>
        {i18n.t("home_empty_subtitle")}
      </Text>

      <Button
        onPress={onRefresh}
        size="lg"
        className="mt-8 rounded-2xl px-12"
        style={{ backgroundColor: colors.primary }}
      >
        <ButtonText className="text-white font-extrabold text-lg">
          {i18n.t("home_empty_cta")}
        </ButtonText>
      </Button>
    </View>
  );
});
HomeEmptyState.displayName = "HomeEmptyState";

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    position: 'relative',
  },
  emptyIconBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});
