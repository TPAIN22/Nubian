/**
 * Cart haptics — fire-and-forget wrappers around `expo-haptics`.
 *
 * Lazily required and fully guarded so a missing native module (Expo Go, web,
 * jest) degrades to "no haptics" instead of a red screen. Mirrors the pattern
 * already used by `components/notifications/haptics.ts`.
 */

import { Platform } from 'react-native';

type HapticsModule = typeof import('expo-haptics');

let cached: HapticsModule | null | undefined;

function getHaptics(): HapticsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-haptics') as HapticsModule;
  } catch {
    cached = null;
  }
  return cached;
}

function run(fn: (H: HapticsModule) => Promise<void>): void {
  if (Platform.OS === 'web') return;
  const H = getHaptics();
  if (!H) return;
  try {
    fn(H).catch(() => {});
  } catch {
    /* haptics are never load-bearing */
  }
}

/** Finger down on the primary CTA. */
export const tapHaptic = () =>
  run(H => H.impactAsync(H.ImpactFeedbackStyle.Light));

/** The add actually started (request in flight). */
export const commitHaptic = () =>
  run(H => H.impactAsync(H.ImpactFeedbackStyle.Medium));

/** Item is in the cart. */
export const successHaptic = () =>
  run(H => H.notificationAsync(H.NotificationFeedbackType.Success));

/** Blocked — out of stock, missing selection, sign-in required. */
export const blockedHaptic = () =>
  run(H => H.notificationAsync(H.NotificationFeedbackType.Warning));

/** Request failed. */
export const errorHaptic = () =>
  run(H => H.notificationAsync(H.NotificationFeedbackType.Error));

/** Quantity +/- tick. */
export const stepHaptic = () => run(H => H.selectionAsync());
