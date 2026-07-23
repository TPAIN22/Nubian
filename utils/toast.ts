/**
 * Toast facade.
 *
 * The call surface is unchanged — `toast.success("msg")`,
 * `toast.error("title", { description })` and the legacy
 * `toast.error("title", "description")` two-string form all still work — but the
 * rendering is now the premium in-app notification card
 * (`components/notifications`) on every platform.
 *
 * Previously this module split by platform: Android got a raw `ToastAndroid`
 * (an un-styleable grey pill that users routinely missed) while iOS got
 * `sonner-native`. Both are gone; there is one presentation everywhere.
 *
 * It imports `NotificationManager` directly rather than the components barrel so
 * Zustand stores (`store/wishlistStore.js`) can call it without pulling React
 * components into a data module.
 */

import {
  NotificationManager,
  notify,
} from '@/components/notifications/NotificationManager';
import type {
  NotificationAction,
  NotificationInput,
  NotificationPriority,
} from '@/components/notifications/types';

/**
 * Options accepted by the variant helpers. A bare string is treated as the
 * description — several existing call sites (NetworkProvider, wishlistStore)
 * use that form, and it used to be silently dropped.
 */
export type ToastOpts =
  | string
  | {
      description?: string;
      /** ms; `null` keeps the card up until dismissed. */
      duration?: number | null;
      priority?: NotificationPriority;
      /** Relative timestamp shown under the message. */
      timestamp?: number | string | Date;
      action?: NotificationAction;
      onPress?: () => void;
      deepLink?: string;
      id?: string;
      dedupeKey?: string;
      dismissible?: boolean;
      haptics?: boolean;
    };

function normalize(
  title: string,
  opts: ToastOpts | undefined
): Omit<NotificationInput, 'variant'> {
  if (typeof opts === 'string') return { title, message: opts };
  if (!opts) return { title };
  const { description, ...rest } = opts;
  return { title, message: description, ...rest };
}

/**
 * Bare `toast("message")` — supported because the previous library was callable
 * and at least one call site relies on it.
 */
function toastFn(message: string, opts?: ToastOpts) {
  return notify({ variant: 'info', ...normalize(message, opts) });
}

export const toast = Object.assign(toastFn, {
  success(message: string, opts?: ToastOpts) {
    return notify({ variant: 'success', ...normalize(message, opts) });
  },
  error(message: string, opts?: ToastOpts) {
    return notify({ variant: 'error', ...normalize(message, opts) });
  },
  info(message: string, opts?: ToastOpts) {
    return notify({ variant: 'info', ...normalize(message, opts) });
  },
  warning(message: string, opts?: ToastOpts) {
    return notify({ variant: 'warning', ...normalize(message, opts) });
  },
  /** Order lifecycle updates — brand-accented, high priority, longer dwell. */
  order(message: string, opts?: ToastOpts) {
    return notify({ variant: 'order', ...normalize(message, opts) });
  },
  /** Promotions and offers — low priority, dismisses quickly, no haptics. */
  promo(message: string, opts?: ToastOpts) {
    return notify({ variant: 'promo', ...normalize(message, opts) });
  },
  /** Full control: variant, action button, timestamp, priority, deep link. */
  show(input: NotificationInput) {
    return notify(input);
  },
  /** Alias kept for parity with the previous toast library's API. */
  custom(input: NotificationInput) {
    return notify(input);
  },
  dismiss(id: string) {
    NotificationManager.dismiss(id);
  },
  dismissAll() {
    NotificationManager.dismissAll();
  },
});

export default toast;
