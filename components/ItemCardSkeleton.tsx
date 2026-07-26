// components/ItemCardSkeleton.tsx
import { useWindowDimensions } from "react-native";
import { SkeletonProductCard } from "@/components/ui/kit";
import { elevation, spacing } from "@/theme/tokens";

/**
 * Loading placeholder for `ProductCard`'s grid variant.
 *
 * Delegates to the kit skeleton so it inherits the card's real geometry
 * (square image well, two-line title, price line). It used to draw a 150px
 * strip with a 70%-wide bar, which was visibly a different shape from the card
 * that replaced it and made every cold load feel like a layout jump.
 */
export default function ItemCardSkeleton({ cardWidth }: { cardWidth?: number } = {}) {
  const { width } = useWindowDimensions();
  const resolvedWidth = cardWidth ?? width / 2 - spacing.lg;

  return <SkeletonProductCard width={resolvedWidth} style={elevation.xs} />;
}
