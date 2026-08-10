import { memo, useCallback } from "react";
import { View, StyleSheet, InteractionManager, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppText, SectionHeader, SkeletonBlock, Touchable } from "@/components/ui/kit";
import { navigateToCollection } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import { useRTL } from "@/hooks/useRTL";
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
 * "Quick collections" — admin-curated collections, straight from the home
 * payload.
 *
 * This used to be five hardcoded Unsplash photos wired to sort presets
 * ("New In" → newArrivals, "Fandom" → flashDeals), which meant the labels
 * promised editorial curation the app could not actually deliver. Now each card
 * is a real Collection and taps through to `/(screens)/collection/[id]`, the
 * same destination a banner with a `collection` target reaches.
 *
 * Layout is three full-bleed banners stacked vertically rather than a rail of
 * 90pt thumbnails: a curated collection is an editorial statement, and at rail
 * size the cover art was unreadable and the name wrapped to two 11pt lines. The
 * cap is deliberate — home already scrolls through banners, categories and five
 * product sections, so collection four onward lives on the collections screen
 * rather than pushing everything below the fold.
 *
 * Data arrives with the rest of the home screen rather than through its own
 * request — the backend already batches banners/categories/collections/stores
 * into one cached call, and adding a second round-trip here would cost a
 * request on every cold start to save nothing.
 */

/** How many collections the home screen shows. See the layout note above. */
const MAX_CARDS = 3;
const CARD_H = 116;
/** Widest a card can render, for CDN sizing only — layout stays fluid. */
const CARD_W = Dimensions.get("window").width - SCREEN_PADDING * 2;

interface Props {
  collections: HomeCollection[];
  isLoading?: boolean;
}

export const QuickCollections = memo(({ collections, isLoading = false }: Props) => {
  const { trackEvent } = useTracking();
  const rtl = useRTL();

  const handlePress = useCallback(
    (item: HomeCollection) => {
      navigateToCollection(item._id, item);
      InteractionManager.runAfterInteractions(() => {
        trackEvent("collection_open", { collectionId: item._id, screen: "home" });
      });
    },
    [trackEvent],
  );

  // Nothing curated yet, and nothing on the way — the section disappears rather
  // than leaving a titled empty band on the home screen.
  if (!isLoading && collections.length === 0) return null;

  const visible = collections.slice(0, MAX_CARDS);

  return (
    <View style={styles.section}>
      <SectionHeader title={String(i18n.t("home_collections") || "Collections")} />

      <View style={styles.stack}>
        {isLoading && visible.length === 0
          ? [0, 1, 2].map((i) => (
              <SkeletonBlock key={i} width="100%" height={CARD_H} rounded={radius.card} />
            ))
          : visible.map((item) => (
              <Touchable
                key={item._id}
                onPress={() => handlePress(item)}
                scaleTo={pressScale.card}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                style={styles.card}
              >
                {item.image ? (
                  <Image
                    // `ikResize` is a no-op (returning null only for a falsy
                    // input) on non-ImageKit URLs, so fall back to the original.
                    source={{ uri: ikResize(item.image, CARD_W * 2) ?? item.image }}
                    style={styles.image}
                    contentFit="cover"
                    transition={220}
                    recyclingKey={item._id}
                  />
                ) : (
                  // A cover is optional in the dashboard, so a collection
                  // without one still gets a card rather than being dropped.
                  <View style={[styles.image, styles.placeholder]}>
                    <Ionicons name="albums-outline" size={iconSize.xxl} color="#FFFFFF" />
                  </View>
                )}

                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.75)"]}
                  style={styles.overlay}
                  pointerEvents="none"
                />

                <View style={styles.footer}>
                  <View style={styles.labels}>
                    <AppText
                      variant="subtitle"
                      weight="700"
                      numberOfLines={1}
                      style={styles.title}
                    >
                      {item.name}
                    </AppText>
                  </View>
                  <Ionicons name={rtl.chevronForward} size={iconSize.md} color="#FFFFFF" />
                </View>
              </Touchable>
            ))}
      </View>
    </View>
  );
});
QuickCollections.displayName = "QuickCollections";

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxl },
  stack: {
    paddingHorizontal: SCREEN_PADDING,
    gap: spacing.md,
  },
  card: {
    width: "100%",
    height: CARD_H,
    borderRadius: radius.card,
    overflow: "hidden",
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    // Literal rather than themed: the title is burnt white onto the gradient,
    // so this tile has to stay dark in both light and dark mode.
    backgroundColor: withAlpha("#000000", 0.55),
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    start: 0,
    end: 0,
    height: "70%",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    start: 0,
    end: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  labels: { flex: 1, gap: 2 },
  title: { color: "#FFFFFF" },
  meta: { color: withAlpha("#FFFFFF", 0.85) },
});
