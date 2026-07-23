/**
 * NotificationContainer — placement and stacking.
 *
 * Single responsibility: put the visible cards in the right place. It anchors
 * to the top of the window *below* the status bar / notch via safe-area insets,
 * spreads the stack as a non-overlapping column (newest first), and lets touches
 * fall through everywhere it isn't drawing a card.
 *
 * It subscribes to the manager through `useSyncExternalStore`, so it re-renders
 * only when the visible list changes — not on every countdown tick.
 */

import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationCard } from './NotificationCard';
import { NOTIFICATION_LAYOUT } from './notificationTheme';
import {
  useAccessibilityAnnouncer,
  useNotificationQueue,
  useReduceMotion,
  useScreenReaderEnabled,
} from './useNotificationQueue';

function NotificationContainerBase() {
  const items = useNotificationQueue();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const screenReaderEnabled = useScreenReaderEnabled();

  useAccessibilityAnnouncer();

  if (items.length === 0) return null;

  return (
    <View
      // Never swallow taps meant for the screen underneath.
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          // Clear the status bar / dynamic island, plus breathing room.
          paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8),
          paddingStart: Math.max(insets.left, 0) + 12,
          paddingEnd: Math.max(insets.right, 0) + 12,
        },
      ]}
    >
      <View pointerEvents="box-none" style={styles.stack}>
        {items.map((item, index) => (
          <NotificationCard
            key={item.id}
            item={item}
            index={index}
            reduceMotion={reduceMotion}
            holdForScreenReader={screenReaderEnabled}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    // Top-anchored: notifications come from where the user's attention already
    // is when a push arrives.
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  stack: {
    width: '100%',
    maxWidth: NOTIFICATION_LAYOUT.maxWidth,
    gap: NOTIFICATION_LAYOUT.stackGap,
  },
});

export const NotificationContainer = memo(NotificationContainerBase);
