/**
 * In-app notification (floating card) types.
 *
 * These describe the *presentation* layer only. They intentionally mirror the
 * shape of `utils/notificationService.ts`'s `Notification` (title / body /
 * deepLink / priority / sentAt) so a server notification can be projected onto
 * a card without any transformation logic living in a component.
 */

export type NotificationVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'order'
  | 'promo';

/**
 * How much of the user's attention the notification deserves. Drives dwell
 * time, visual emphasis and haptics — never business behaviour.
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationAction {
  label: string;
  /** Called on press. Runs before the card is dismissed. */
  onPress?: () => void;
  /**
   * Backend-style deep link (`/orders/<id>`, `/products/<id>`, …). Routed
   * through the existing `navigateFromNotificationLink` parser — no new
   * navigation logic.
   */
  deepLink?: string;
}

/** What a caller passes to `notify()`. Everything except `title` is optional. */
export interface NotificationInput {
  /** Stable id. Re-showing the same id refreshes the existing card in place. */
  id?: string;
  variant?: NotificationVariant;
  title: string;
  message?: string;
  /** Shown as relative time ("2m ago"). Accepts ms, ISO string or Date. */
  timestamp?: number | string | Date;
  /** Explicit dwell time in ms. `null` = sticky (manual dismiss only). */
  duration?: number | null;
  priority?: NotificationPriority;
  action?: NotificationAction;
  /** Tap anywhere on the card. */
  onPress?: () => void;
  /** Tap target when no `onPress` is given — routed via deepLinks.ts. */
  deepLink?: string;
  /** Set false to hide the close button and disable swipe (rare). */
  dismissible?: boolean;
  /** Set false to silence haptics for this one notification. */
  haptics?: boolean;
  /**
   * Collapse key. Two notifications with the same key never stack — the second
   * refreshes the first. Defaults to `variant|title|message`.
   */
  dedupeKey?: string;
}

/** A queued/visible notification after defaults have been resolved. */
export interface NotificationItem {
  id: string;
  dedupeKey: string;
  variant: NotificationVariant;
  priority: NotificationPriority;
  title: string;
  message?: string;
  timestamp?: number;
  duration: number | null;
  action?: NotificationAction;
  onPress?: () => void;
  deepLink?: string;
  dismissible: boolean;
  haptics: boolean;
  createdAt: number;
  /**
   * Bumped whenever a duplicate refreshes this item. Cards use it as an
   * animation/progress reset key without remounting.
   */
  revision: number;
  /** True while the exit animation is playing; the card unmounts after. */
  exiting: boolean;
}
