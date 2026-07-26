// components/BannerSkeleton.tsx
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { SkeletonBlock } from "@/components/ui/kit";
import { radius, spacing } from "@/theme/tokens";

/**
 * Placeholder for the home hero.
 *
 * Sized from the same 0.92 ratio the real `BannerCarousel` uses, so the feed
 * doesn't shift when the banner lands. It also sketches the copy block and
 * pagination, which makes the wait read as "the hero is loading" rather than
 * "there's a grey box here".
 */
const BANNER_RATIO = 0.92;

export default function BannerSkeleton() {
  const { width } = useWindowDimensions();
  const height = Math.round(width * BANNER_RATIO);

  return (
    <View style={{ width, height }} accessibilityLabel="Loading featured offers">
      <SkeletonBlock width="100%" height={height} rounded={0} />

      <View style={styles.copy}>
        <SkeletonBlock width="70%" height={26} rounded={radius.xs} />
        <SkeletonBlock width="45%" height={14} rounded={radius.xs} />
        <SkeletonBlock width={120} height={40} rounded={radius.pill} />
      </View>

      <View style={styles.dots}>
        <SkeletonBlock width={22} height={6} rounded={3} />
        <SkeletonBlock width={6} height={6} rounded={3} />
        <SkeletonBlock width={6} height={6} rounded={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    position: "absolute",
    bottom: spacing.xxl + spacing.md,
    start: spacing.lg,
    end: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    position: "absolute",
    bottom: spacing.base,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
