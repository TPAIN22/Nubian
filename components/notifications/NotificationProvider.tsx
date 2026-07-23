/**
 * InAppNotificationProvider — convenience wrapper that renders children plus
 * the portal.
 *
 * Named `InAppNotificationProvider` (not `NotificationProvider`) so it can't be
 * confused with `providers/notificationProvider.tsx`, which owns *push*
 * permissions and token registration. That one is untouched; this one only
 * mounts the in-app card surface.
 *
 * No React context is needed: `NotificationManager` is a module-level store, so
 * `notify()` works from Zustand stores, axios interceptors and plain utils that
 * have no access to the React tree. `useNotify()` exists for components that
 * prefer a hook.
 */

import { memo, type PropsWithChildren } from 'react';
import { NotificationPortal } from './NotificationPortal';

function InAppNotificationProviderBase({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <NotificationPortal />
    </>
  );
}

export const InAppNotificationProvider = memo(InAppNotificationProviderBase);
