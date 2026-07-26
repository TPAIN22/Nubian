/**
 * The fixed centre pin.
 *
 * Rendered in React Native on top of the map rather than as a map marker: it
 * never moves, so it costs the map engine nothing, it animates at native
 * refresh rate, and it looks identical whichever adapter is underneath.
 *
 * While the map is moving the pin lifts and its shadow shrinks — the standard
 * cue that the map is sliding beneath a stationary pin, not the other way round.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCheckoutTheme } from '@/components/checkout';

const LIFT_DISTANCE = 12;
const PIN_SIZE = 40;

interface Props {
  /** True while the user is panning or zooming. */
  isMoving: boolean;
  color?: string;
}

export const CenterPin = React.memo(function CenterPin({ isMoving, color }: Props) {
  const t = useCheckoutTheme();
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.value = isMoving
      ? withSpring(1, { damping: 14, stiffness: 180 })
      : withSpring(0, { damping: 16, stiffness: 200 });
  }, [isMoving, lift]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value * LIFT_DISTANCE }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - lift.value * 0.35 }],
    opacity: withTiming(isMoving ? 0.25 : 0.45, { duration: 160 }),
  }));

  const pinColor = color ?? t.accent;

  return (
    // pointerEvents="none" is essential: the pin sits over the map, and
    // swallowing touches here would make the map undraggable.
    <View style={styles.container} pointerEvents="none">
      <View style={styles.stack}>
        <Animated.View style={[styles.pin, pinStyle]}>
          <Ionicons name="location" size={PIN_SIZE} color={pinColor} />
        </Animated.View>

        {/* Ground shadow marks the exact selected point. */}
        <Animated.View
          style={[styles.shadow, { backgroundColor: t.isDark ? '#000' : '#1f2937' }, shadowStyle]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
    // The icon's visual tip sits at its bottom edge, so the whole stack is
    // raised by half its height to put that tip on the map's exact centre.
    marginBottom: PIN_SIZE,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    marginTop: -2,
  },
});

export default CenterPin;
