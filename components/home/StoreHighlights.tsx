import { memo, useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, InteractionManager } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";
import axiosInstance from "@/services/api/client";
import { navigateToStore } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import {
  AppText,
  SectionHeader,
  SkeletonBlock,
  Touchable,
} from "@/components/ui/kit";
import { elevation, iconSize, pressScale, radius, SCREEN_PADDING, spacing } from "@/theme/tokens";
import i18n from "@/utils/i18n";

interface Merchant {
  _id: string;
  name: string;
  logo?: string | null;
}

interface Props {
  colors: any;
  isDark?: boolean;
}

/** Circular logo diameter. Also drives the CDN resize and the skeleton. */
const AVATAR = 88;
const TILE_WIDTH = 84;

/**
 * "Top stores" rail.
 *
 * Redesigned from a copy of the category tile (a photo behind a dark gradient
 * with the name burnt into it) into a proper store identity: a round white
 * avatar with the merchant logo, name underneath on the canvas.
 *
 * Two reasons that matters — merchant logos are usually square marks on a light
 * background, so darkening them for a text overlay destroyed them; and a round
 * avatar is the universal signifier for "a seller", which distinguishes this
 * rail from the category rail directly above it.
 */
export const StoreHighlights = memo(({ colors }: Props) => {
  const { trackEvent } = useTracking();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMerchants = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/merchants/list", { params: { limit: 10 } });

      const body = res.data?.data ?? res.data;
      const list: any[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];

      setMerchants(
        list.map((m: any) => ({
          _id:  String(m._id),
          name: m.storeName || m.name || "Store",
          logo: m.logoUrl ?? m.logo ?? null,
        }))
      );
    } catch {
      // silent — section simply won't render
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handlePress = useCallback(
    (item: Merchant) => {
      navigateToStore(item._id, item);
      InteractionManager.runAfterInteractions(() => {
        trackEvent("store_open", { storeId: item._id, screen: "home" });
      });
    },
    [trackEvent]
  );

  const renderSeparator = useCallback(() => <View style={{ width: spacing.md }} />, []);

  if (!isLoading && merchants.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={i18n.t("home_topStores")} />

      {isLoading ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.tile}>
              <SkeletonBlock width={AVATAR} height={AVATAR} rounded={AVATAR / 2} />
              <SkeletonBlock width={56} height={11} rounded={radius.xs} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={merchants}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.railContent}
          ItemSeparatorComponent={renderSeparator}
          renderItem={({ item }) => (
            <Touchable
              onPress={() => handlePress(item)}
              scaleTo={pressScale.card}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              style={styles.tile}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.surface, borderColor: colors.borderLight },
                  elevation.xs,
                ]}
              >
                {item.logo ? (
                  <Image
                    source={{ uri: item.logo }}
                    style={styles.avatarImg}
                    // `contain` not `cover`: merchant marks are logos, and
                    // cropping one to fill a circle cuts the brand in half.
                    contentFit="contain"
                    transition={220}
                    recyclingKey={item._id}
                  />
                ) : (
                  <Ionicons name="storefront" size={iconSize.xl} color={colors.text.subtle} />
                )}
              </View>

              <AppText variant="micro" tone="body" numberOfLines={2} align="center">
                {item.name}
              </AppText>
            </Touchable>
          )}
        />
      )}
    </View>
  );
});
StoreHighlights.displayName = "StoreHighlights";

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl },
  railContent: { paddingHorizontal: SCREEN_PADDING, paddingVertical: spacing.xs },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
  },
  tile: { width: TILE_WIDTH, alignItems: "center", gap: spacing.sm },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
});
