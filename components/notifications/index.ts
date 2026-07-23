/**
 * In-app notification system — public surface.
 *
 * Importing from this barrel pulls in React components. Non-UI callers (Zustand
 * stores, utils, interceptors) should import `./NotificationManager` directly —
 * `utils/toast.ts` does exactly that — to avoid dragging the renderer into a
 * plain data module.
 */

export { NotificationPortal } from './NotificationPortal';
export { InAppNotificationProvider } from './NotificationProvider';
export { NotificationContainer } from './NotificationContainer';
export { NotificationCard } from './NotificationCard';
export { NotificationIcon } from './NotificationIcon';
export { NotificationProgress } from './NotificationProgress';
export { NotificationGesture } from './NotificationGesture';
export { NotificationAnimator } from './NotificationAnimator';

export {
  NotificationManager,
  notify,
  dismissNotification,
  dismissAllNotifications,
  DURATION_BY_PRIORITY,
} from './NotificationManager';
export { NotificationQueue, MAX_VISIBLE, MAX_PENDING } from './NotificationQueue';

export {
  useNotify,
  useNotificationQueue,
  useReduceMotion,
  useScreenReaderEnabled,
} from './useNotificationQueue';

export {
  getVariantVisuals,
  getPriorityVisuals,
  withAlpha,
  NOTIFICATION_LAYOUT,
} from './notificationTheme';

export type {
  NotificationAction,
  NotificationInput,
  NotificationItem,
  NotificationPriority,
  NotificationVariant,
} from './types';

export { NotificationPermissionSheet } from './NotificationPermissionSheet';
