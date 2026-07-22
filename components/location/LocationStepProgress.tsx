import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useCheckoutTheme } from "@/components/checkout";

interface Props {
  /** Zero-based index of the active step (0..total-1). */
  index: number;
  total?: number;
}

/**
 * A slim segmented progress bar that fills as the user advances through the
 * country → city → area steps. Purely presentational; the animation is a soft
 * width/opacity tween, nothing that competes for attention with the list.
 */
export const LocationStepProgress = React.memo(function LocationStepProgress({
  index,
  total = 3,
}: Props) {
  const segments = Array.from({ length: total }, (_, i) => i);
  return (
    <View style={styles.row} accessibilityElementsHidden>
      {segments.map(i => (
        <Segment key={i} filled={i <= index} />
      ))}
    </View>
  );
});

const Segment = React.memo(function Segment({ filled }: { filled: boolean }) {
  const t = useCheckoutTheme();
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [filled, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ scaleX: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <View style={[styles.track, { backgroundColor: t.surfaceMuted }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: t.accent, borderRadius: 999 },
          animatedStyle,
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
});
