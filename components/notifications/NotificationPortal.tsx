/**
 * NotificationPortal — the mount point.
 *
 * React Native has no real portal, so "above everything" means "last sibling in
 * the root tree with a high zIndex". Mount this once, as the final child of the
 * root layout (after the navigator), and every `notify()` call anywhere in the
 * app renders here.
 *
 * It must sit inside `GestureHandlerRootView` (for swipe) and
 * `SafeAreaProvider` (for insets) — both already wrap the app in
 * `app/_layout.tsx`.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NotificationContainer } from './NotificationContainer';

function NotificationPortalBase() {
  return (
    <View pointerEvents="box-none" style={styles.portal}>
      <NotificationContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
    // Above the navigator and any in-screen overlays. RN maps zIndex to sibling
    // ordering on Android, which is exactly what we want here.
    zIndex: 9999,
  },
});

export const NotificationPortal = memo(NotificationPortalBase);
