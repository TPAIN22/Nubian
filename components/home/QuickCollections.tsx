import { memo, useCallback } from "react";
import { View, FlatList, StyleSheet, InteractionManager } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppText, SectionHeader, SkeletonBlock, Touchable } from "@/components/ui/kit";
import { navigateToCollection } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { ikResize } from "@/utils/imageCdn";
import {
  iconSize,
  pressScale,
  radius,
  SCREEN_PADDING,
  spacing,
  withAlpha,
} from "@/theme/tokens";
import i18n from "@/utils/i18n";
import type { HomeCollection } from "@/api/home.api";

/**
 * "Quick collections" rail — admin-curated collections, straight from the home
 * payload.
 *
 * This used to be five hardcoded Unsplash photos wired to sort presets
 * ("New In" → newArrivals, "Fandom" → flashDeals), which meant the labels
 * promised editorial curation the app could not actually deliver. Now each card
 * is a real Collection and taps through to `/(screens)/collection/[id]`, the
 * same destination a banner with a `collection` target reaches.
 *
 * Data arrives with the rest of the home screen rather than through its own
 * request — the backend already batches banners/categories/collections/stores
 * into one cached call, and adding a second round-trip here would cost a
 * request on every cold start to save nothing.
 */

const CARD_W = 90;
const CARD_H = 130;

interface Props {
  collections: HomeCollection[];
  isLoading?: boolean;
}

export const QuickCollections = memo(({ collections, isLoading = false }: Props) => {
  const { trackEvent } = useTracking();

  const handlePress = useCallback(
    (item: HomeCollection) => {
      navigateToCollection(item._id, item);
      InteractionManager.runAfterInteractions(() => {
        trackEvent("collection_open", { collectionId: item._id, screen: "home" });
      });
    },
    [trackEvent],
  );

  const renderSeparator = useCallback(() => <View style={{ width: spacing.sm }} />, []);

  const renderItem = useCallback(
    ({ item }: { item: HomeCollection }) => (
      <Touchable
        onPress={() => handlePress(item)}
        scaleTo={pressScale.card}
        accessibilityRole="button"
        accessibilityLabel={item.name}
        style={styles.card}
      >
        {item.image ? (
          <Image
            // `ikResize` is a no-op (returning null only for a falsy input) on
            // non-ImageKit URLs, so fall back to the original.
            source={{ uri: ikResize(item.image, CARD_W * 2) ?? item.image }}
            style={styles.image}
            contentFit="cover"
            transition={220}
            recyclingKey={item._id}
          />
        ) : (
          // A cover is optional in the dashboard, so a collection without one
          // still gets a card rather than being dropped from the rail.
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="albums-outline" size={iconSize.xl} color="#FFFFFF" />
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.overlay}
          pointerEvents="none"
        />

        <AppText variant="micro" weight="700" numberOfLines={2} align="center" style={styles.title}>
          {item.name}
        </AppText>
      </Touchable>
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: HomeCollection) => item._id, []);

  // Nothing curated yet, and nothing on the way — the rail disappears rather
  // than leaving a titled empty band on the home screen.
  if (!isLoading && collections.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={String(i18n.t("home_collections") || "Collections")} />

      {isLoading && collections.length === 0 ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} width={CARD_W} height={CARD_H} rounded={radius.sm} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={collections}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.railContent}
        />
      )}
    </View>
  );
});
QuickCollections.displayName = "QuickCollections";

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl },
  railContent: { paddingHorizontal: SCREEN_PADDING },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radius.sm,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    // Literal rather than themed: the title below is burnt white onto the
    // gradient, so this tile has to stay dark in both light and dark mode.
    backgroundColor: withAlpha("#000000", 0.55),
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    start: 0,
    end: 0,
    height: "50%",
  },
  title: {
    position: "absolute",
    bottom: spacing.sm,
    start: spacing.xs,
    end: spacing.xs,
    color: "#FFFFFF",
  },
});
