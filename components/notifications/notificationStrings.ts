/**
 * Localised strings for the notification UI.
 *
 * Wraps `i18n.t` with an English fallback so a missing key renders real copy
 * instead of i18n-js's `[missing "en.x" translation]` placeholder — a toast is
 * the worst possible place to leak a debug string.
 */

import i18n from '@/utils/i18n';

export function t(key: string, fallback: string, options?: Record<string, any>): string {
  try {
    const value = i18n.t(key, options);
    if (typeof value !== 'string' || value.includes('missing')) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/**
 * "Just now" / "5m ago" / "3h ago" / "2d ago", matching the wording already
 * used by the notification inbox screen.
 */
export function formatRelativeTime(timestamp: number | undefined): string | null {
  if (!timestamp || Number.isNaN(timestamp)) return null;

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return t('notif_justNow', 'Just now');

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('notif_justNow', 'Just now');

  const hours = Math.floor(minutes / 60);
  if (hours < 1) return t('notif_minutesAgo', `${minutes}m ago`, { count: minutes });

  const days = Math.floor(hours / 24);
  if (days < 1) return t('notif_hoursAgo', `${hours}h ago`, { count: hours });

  if (days < 7) return t('notif_daysAgo', `${days}d ago`, { count: days });

  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return null;
  }
}

export const strings = {
  dismiss: () => t('notif_dismiss', 'Dismiss'),
  urgent: () => t('notif_urgent', 'Urgent'),
  view: () => t('notif_view', 'View'),
  /** Screen-reader hint for the swipe affordance. */
  swipeHint: () => t('notif_swipeHint', 'Swipe to dismiss, or double tap to open'),
};
