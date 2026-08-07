import { memo, useState, useCallback } from "react";
import { View, StyleSheet, I18nManager } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Carousel from "react-native-reanimated-carousel";
import { useResponsive } from "@/hooks/useResponsive";
import { useTracking } from "@/hooks/useTracking";
import { navigateBanner } from "@/utils/deepLinks";
import { NAVIGABLE_TARGET_TYPES, resolveBannerTarget } from "@/utils/bannerTarget";
import { ikResize } from "@/utils/imageCdn";
import { AppText, Touchable } from "@/components/ui/kit";
import { animation, pressScale, radius, spacing } from "@/theme/tokens";

/**
 * Hero banner ratio.
 *
 * Was 1.1× the screen width, which on a 390pt phone pushed everything else
 * fully below the fold — the customer landed on an advert with no evidence the
 * app sold anything. 0.92 keeps the hero dominant while leaving the category
 * rail peeking at the bottom edge, which is what invites the first scroll.
 */
const BANNER_RATIO = 0.92;

/** Height of the scrim that keeps banner copy legible over any photo. */
const SCRIM_HEIGHT = 220;

export const BannerCarousel = memo(
  ({ banners, colors }: { banners: any[]; colors: any }) => {
    const isRTL = I18nManager.isRTL;
    const { window } = useResponsive();
    const screenWidth = window.width;
    const bannerHeight = Math.round(screenWidth * BANNER_RATIO);
    const [activeIndex, setActiveIndex] = useState(0);
    const { trackEvent } = useTracking();
    // Pause autoplay when the Home tab isn't focused so the carousel isn't
    // burning timers + re-rasterizing images behind other screens.
    const isFocused = useIsFocused();

    const onProgressChange = useCallback((_: number, absoluteProgress: number) => {
      const index = Math.round(absoluteProgress) % banners.length;
      // ensure index is positive
      const safeIndex = index < 0 ? index + banners.length : index;
      // Only commit to React state on an actual index change — the progress
      // callback fires every frame, so unconditional setState would re-render
      // the whole carousel tree ~60x/sec.
      setActiveIndex((prev) => (prev === safeIndex ? prev : safeIndex));
    }, [banners.length]);

    const renderBannerItem = useCallback(({ item }: { item: any }) => {
      // A banner with no target is decoration, not a control. Without this it
      // still pressed, scaled and announced itself as a button to a screen
      // reader, then did nothing — which reads as a broken tap.
      const target = resolveBannerTarget(item);
      const actionable = NAVIGABLE_TARGET_TYPES.includes(target.type);

      return (
        <Touchable
          onPress={actionable ? () => {
            trackEvent('banner_click', {
              bannerId: item._id,
              screen: 'home',
              targetType: target.type,
              ...(target.id ? { targetId: target.id } : {}),
            });
            navigateBanner(item);
          } : undefined}
          disabled={!actionable}
          scaleTo={actionable ? pressScale.card : 1}
          accessibilityRole={actionable ? "button" : "image"}
          accessibilityLabel={item.title || item.description || "Banner"}
          style={{ width: screenWidth, height: bannerHeight }}
        >
          <Image
            source={{ uri: ikResize(item.image, screenWidth) ?? item.image }}
            style={[styles.bannerImage, { width: screenWidth, height: bannerHeight }]}
            contentFit="cover"
            transition={animation.slow}
            // Neutral well behind the photo, so a slow image decode shows a calm
            // grey rather than a white flash against the dark scrim.
            placeholderContentFit="cover"
          />

          {/* Top scrim: keeps the floating white header icons readable over a
              bright photo without darkening the whole banner. */}
          <LinearGradient
            colors={["rgba(11,18,32,0.45)", "transparent"]}
            style={styles.topScrim}
            pointerEvents="none"
          />

          {/* Bottom scrim: three stops instead of two so the fade is smooth
              rather than a visible band across the image. */}
          <LinearGradient
            colors={["transparent", "rgba(11,18,32,0.35)", "rgba(11,18,32,0.82)"]}
            locations={[0, 0.45, 1]}
            style={[styles.bottomScrim, { height: SCRIM_HEIGHT }]}
            pointerEvents="none"
          />

          {(item.title || item.description) && (
            <View style={styles.content}>
              {item.title && (
                <AppText variant="hero" style={styles.title} numberOfLines={2}>
                  {item.title}
                </AppText>
              )}
              {item.description && (
                <AppText variant="bodySmall" style={styles.description} numberOfLines={2}>
                  {item.description}
                </AppText>
              )}
              {/* Reads as a CTA without being a real button — tapping anywhere on
                  the banner already navigates, and a nested button would create a
                  second, competing target. Suppressed when there is nowhere to go,
                  so the banner never promises a destination it doesn't have. */}
              {actionable && (
                <View style={[styles.cta, { backgroundColor: colors.primary }]}>
                  <AppText variant="label" weight="700" style={{ color: colors.onPrimary }}>
                    Shop now
                  </AppText>
                </View>
              )}
            </View>
          )}
        </Touchable>
      );
    }, [screenWidth, bannerHeight, colors, trackEvent]);

    if (banners.length === 0) return null;

    return (
      <View style={styles.section}>
        <Carousel
          data={banners}
          width={screenWidth}
          height={bannerHeight}
          loop={banners.length > 1}
          autoPlay={banners.length > 1 && isFocused}
          autoPlayInterval={4500}
          scrollAnimationDuration={700}
          onProgressChange={onProgressChange}
          renderItem={renderBannerItem}
        />

        {banners.length > 1 && (
          <View
            style={[styles.pagination, isRTL && { flexDirection: "row-reverse" }]}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          >
            {banners.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex
                    ? { backgroundColor: colors.text.inverse, width: 22 }
                    : { backgroundColor: "rgba(255,255,255,0.45)", width: 6 },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);
BannerCarousel.displayName = "BannerCarousel";

const styles = StyleSheet.create({
  section: { position: "relative" },
  bannerImage: {},

  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  content: {
    position: "absolute",
    bottom: spacing.xxl + spacing.md,
    start: spacing.lg,
    end: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: "#FFFFFF" },
  description: { color: "rgba(255,255,255,0.86)" },
  cta: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },

  pagination: {
    position: "absolute",
    bottom: spacing.base,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  // A widening pill for the active slide reads as progress; five identical
  // dots read as decoration.
  dot: { height: 6, borderRadius: 3 },
});
