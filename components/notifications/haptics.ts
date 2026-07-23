/**
 * Variant/priority → haptic mapping.
 *
 * `expo-haptics` is already a dependency (used by the tab bar, onboarding and
 * product actions) — nothing new is added here. The module is required lazily
 * and every call is fire-and-forget so a missing native module (Expo Go, web,
 * jest) can never break a notification.
 */

import { Platform } from 'react-native';
import type { NotificationPriority, NotificationVariant } from './types';

type HapticsModule = typeof import('expo-haptics');

let cached: HapticsModule | null | undefined;

function getHaptics(): HapticsModule | null {
  if (cached !== undefined) return cached;
  try {
    // Lazy so a missing native module degrades to "no haptics", not a red screen.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-haptics') as HapticsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * Play the feedback that matches a notification's meaning.
 *
 * Deliberately conservative: low-priority chatter (promos, "loading…") stays
 * silent so haptics keep signalling something worth looking at.
 */
export function playNotificationHaptic(
  variant: NotificationVariant,
  priority: NotificationPriority
): void {
  if (Platform.OS === 'web') return;
  const H = getHaptics();
  if (!H) return;

  const run = (fn: () => Promise<void>) => {
    try {
      fn().catch(() => {});
    } catch {
      /* haptics are never load-bearing */
    }
  };

  switch (variant) {
    case 'success':
      run(() => H.notificationAsync(H.NotificationFeedbackType.Success));
      return;
    case 'error':
      run(() => H.notificationAsync(H.NotificationFeedbackType.Error));
      return;
    case 'warning':
      run(() => H.notificationAsync(H.NotificationFeedbackType.Warning));
      return;
    case 'order':
      // Order updates matter but aren't failures — a solid impact, stronger
      // when the update is urgent.
      run(() =>
        H.impactAsync(
          priority === 'critical'
            ? H.ImpactFeedbackStyle.Heavy
            : H.ImpactFeedbackStyle.Medium
        )
      );
      return;
    case 'info':
    case 'promo':
    default:
      if (priority === 'low') return;
      run(() => H.selectionAsync());
  }
}

/** Light tick used when the user swipes a card away or taps close. */
export function playDismissHaptic(): void {
  if (Platform.OS === 'web') return;
  const H = getHaptics();
  if (!H) return;
  try {
    H.impactAsync(H.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    /* noop */
  }
}
