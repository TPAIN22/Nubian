/**
 * NotificationAnimator — entry, exit and stack-depth motion.
 *
 * Single responsibility: how a card enters, how it leaves, and how it settles
 * back as newer cards land on top of it. All of it runs on the UI thread via
 * shared values; the only JS callback is `onExited`, fired once when the exit
 * animation completes so the manager can unmount the item.
 *
 * Reanimated's `LinearTransition` handles the *positional* reflow when a card
 * above is removed, so the remaining cards glide up instead of snapping.
 */

import { memo, useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const ENTER_SPRING = { damping: 18, stiffness: 190, mass: 0.85 } as const;
const EXIT_MS = 200;
const REDUCED_MS = 130;
const DEPTH_MS = 260;

interface Props {
  children: ReactNode;
  /** 0 = frontmost/newest. Deeper cards sit slightly smaller and dimmer. */
  index: number;
  /** True once the manager has started dismissing this card. */
  exiting: boolean;
  /** Fired exactly once when the exit animation finishes. */
  onExited: () => void;
  reduceMotion: boolean;
}

function NotificationAnimatorBase({
  children,
  index,
  exiting,
  onExited,
  reduceMotion,
}: Props) {
  // 0 → off-stage, 1 → fully presented.
  const presence = useSharedValue(0);
  const depth = useSharedValue(index);

  useEffect(() => {
    presence.value = reduceMotion
      ? withTiming(1, { duration: REDUCED_MS })
      : withSpring(1, ENTER_SPRING);
    // Entry runs once per mount; refreshes reuse the same card by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!exiting) return;
    presence.value = withTiming(
      0,
      { duration: reduceMotion ? REDUCED_MS : EXIT_MS, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onExited)();
      }
    );
  }, [exiting, onExited, presence, reduceMotion]);

  useEffect(() => {
    depth.value = reduceMotion
      ? index
      : withTiming(index, { duration: DEPTH_MS, easing: Easing.out(Easing.cubic) });
  }, [index, depth, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const depthScale = interpolate(depth.value, [0, 1, 2], [1, 0.965, 0.93], 'clamp');
    const depthOpacity = interpolate(depth.value, [0, 1, 2], [1, 0.86, 0.7], 'clamp');
    const enterScale = reduceMotion
      ? 1
      : interpolate(presence.value, [0, 1], [0.9, 1], 'clamp');

    return {
      opacity: presence.value * depthOpacity,
      transform: [
        {
          translateY: reduceMotion
            ? 0
            : interpolate(presence.value, [0, 1], [-36, 0], 'clamp'),
        },
        { scale: enterScale * depthScale },
      ],
    };
  });

  return (
    <Animated.View
      // Position reflow when a sibling above is removed.
      layout={reduceMotion ? undefined : LinearTransition.springify().damping(20)}
      style={[styles.container, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export const NotificationAnimator = memo(NotificationAnimatorBase);
