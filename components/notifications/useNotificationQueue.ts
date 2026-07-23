/**
 * React bindings for the notification store.
 *
 * `useSyncExternalStore` over the manager's cached snapshot means the container
 * re-renders only when the visible list actually changes — a notification's
 * internal timer ticking, or a card being touched, never re-renders the tree.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import { NotificationManager, notify } from './NotificationManager';
import type { NotificationInput, NotificationItem } from './types';

/** The cards currently on screen, newest first. */
export function useNotificationQueue(): NotificationItem[] {
  return useSyncExternalStore(
    NotificationManager.subscribe,
    NotificationManager.getSnapshot,
    NotificationManager.getServerSnapshot
  );
}

/**
 * Imperative API for components. Stable identity — safe in dependency arrays.
 */
export function useNotify() {
  return useMemo(
    () => ({
      notify: (input: NotificationInput) => notify(input),
      dismiss: NotificationManager.dismiss,
      dismissAll: NotificationManager.dismissAll,
    }),
    []
  );
}

/**
 * Honour the OS "Reduce Motion" setting. Cards fall back to a short cross-fade
 * instead of slide/scale/spring when it is on.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduceMotion(enabled);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      cancelled = true;
      sub?.remove?.();
    };
  }, []);

  return reduceMotion;
}

/**
 * Whether a screen reader is active. Used to make cards sticky — an assistive
 * user should never lose a message to a 4-second timer.
 */
export function useScreenReaderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => {
        if (!cancelled) setEnabled(value);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => {
      cancelled = true;
      sub?.remove?.();
    };
  }, []);

  return enabled;
}

/**
 * Wires the manager's announcer to the platform screen reader for the lifetime
 * of the container.
 */
export function useAccessibilityAnnouncer(): void {
  const announce = useCallback((message: string) => {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch {
      /* announcements are best-effort */
    }
  }, []);

  useEffect(() => {
    NotificationManager.setAnnouncer(announce);
    return () => NotificationManager.setAnnouncer(null);
  }, [announce]);
}
