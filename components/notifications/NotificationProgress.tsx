/**
 * NotificationProgress — the auto-dismiss countdown rail.
 *
 * Runs entirely on the UI thread (a single `scaleX` on a shared value), so the
 * countdown never causes a React render and never competes with the JS thread
 * during list scrolling. It mirrors the manager's clock rather than owning it:
 * the manager is authoritative for *when* a card dies, this just visualises it.
 *
 * Nothing renders for sticky notifications (`duration === null`).
 */

import { memo, useEffect, useRef } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { NOTIFICATION_LAYOUT, withAlpha } from './notificationTheme';

interface Props {
  /** Total dwell time in ms, or null for sticky notifications. */
  duration: number | null;
  /** True while the user is touching the card. */
  paused: boolean;
  /** Bumped when a duplicate refreshes the card — restarts the countdown. */
  revision: number;
  color: string;
}

function NotificationProgressBase({ duration, paused, revision, color }: Props) {
  const progress = useSharedValue(1);
  const lastRevision = useRef<number | null>(null);

  useEffect(() => {
    if (duration === null) return;

    if (paused) {
      cancelAnimation(progress);
      return;
    }

    // A revision bump restarts from full; a resume continues from where the
    // user's finger stopped it.
    const restart = lastRevision.current !== revision;
    lastRevision.current = revision;
    const from = restart ? 1 : progress.value;

    progress.value = from;
    progress.value = withTiming(0, {
      duration: Math.max(80, duration * from),
      easing: Easing.linear,
    });
  }, [duration, paused, revision, progress]);

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  if (duration === null) return null;

  return (
    <View style={[styles.track, { backgroundColor: withAlpha(color, 0.14) }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            // Drain towards the reading direction's end so it feels like time
            // running out, not a bar filling up.
            transformOrigin: I18nManager.isRTL ? 'right center' : 'left center',
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    height: NOTIFICATION_LAYOUT.progressHeight,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});

export const NotificationProgress = memo(NotificationProgressBase);
