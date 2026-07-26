/**
 * Device location, with every failure mode the address picker has to survive.
 *
 * The picker must stay usable when location is denied, when GPS is off, when
 * the fix times out, and offline. In every one of those cases the map simply
 * starts at a sensible default and the shopper pans to their address by hand —
 * so this hook reports *why* it failed rather than throwing, and the screen
 * shows a hint instead of an error state.
 */
import { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { GeoPoint } from '@/services/geo/types';
import { trace, traceError } from '@/components/map/trace';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  /** Denied with "don't ask again" — only Settings can fix it. */
  | 'blocked'
  /** Permission is fine but the OS location service is switched off. */
  | 'servicesDisabled'
  /** Permitted, but no fix arrived in time. */
  | 'unavailable';

export interface DeviceLocationState {
  status: LocationStatus;
  coords: GeoPoint | null;
  /** Reported horizontal accuracy in metres, when the platform provides it. */
  accuracyMeters: number | null;
  isLoading: boolean;
}

const FIX_TIMEOUT_MS = 12000;

/**
 * A cached fix older than this is not worth showing as "your location" — the
 * user may be a city away — but it is still a far better starting centre than
 * the country default while a fresh fix is acquired.
 */
const STALE_FIX_MS = 5 * 60 * 1000;

export function useDeviceLocation() {
  const [state, setState] = useState<DeviceLocationState>({
    status: 'idle',
    coords: null,
    accuracyMeters: null,
    isLoading: false,
  });

  // Guards against a second request while one is in flight (double-tap on the
  // locate button) and against setting state after unmount.
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  /**
   * Live mirror of `status`.
   *
   * `request()` is awaited inside effects that captured `state` at creation
   * time, so reading `status` from that closure afterwards returns the value
   * from before the call — which made debug logs claim "idle" for a permission
   * that had actually been granted. Callers that need the current value after
   * awaiting should use `getStatus()`.
   */
  const statusRef = useRef<LocationStatus>('idle');

  const safeSet = useCallback((next: Partial<DeviceLocationState>) => {
    if (next.status) {
      statusRef.current = next.status;
      trace('gps', `status → ${next.status}`, next.coords ?? undefined);
    }
    if (mountedRef.current) setState((prev) => ({ ...prev, ...next }));
  }, []);

  /** The current status, safe to read immediately after awaiting `request()`. */
  const getStatus = useCallback(() => statusRef.current, []);

  /**
   * Ask for permission and acquire a position.
   *
   * @param options.promptIfBlocked - when the permission is permanently denied,
   *   send the user to the OS settings screen. Only pass this for an explicit
   *   user action (tapping "use my location"), never on screen open.
   * @returns the coordinates, or null with `state.status` explaining why not.
   */
  const request = useCallback(
    async ({ promptIfBlocked = false }: { promptIfBlocked?: boolean } = {}): Promise<
      GeoPoint | null
    > => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;
      safeSet({ status: 'requesting', isLoading: true });

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          safeSet({ status: 'servicesDisabled', isLoading: false });
          return null;
        }

        const existing = await Location.getForegroundPermissionsAsync();
        let granted = existing.granted;

        if (!granted) {
          // `canAskAgain: false` means the OS will silently reject any further
          // prompt, so asking again would look like the button is broken.
          if (!existing.canAskAgain) {
            safeSet({ status: 'blocked', isLoading: false });
            if (promptIfBlocked) {
              await Linking.openSettings().catch(() => {});
            }
            return null;
          }

          const requested = await Location.requestForegroundPermissionsAsync();
          granted = requested.granted;

          if (!granted) {
            safeSet({
              status: requested.canAskAgain ? 'denied' : 'blocked',
              isLoading: false,
            });
            return null;
          }
        }

        // Show the last known fix immediately when it's recent — it makes the
        // map feel instant while the real fix is still being acquired.
        const cached = await Location.getLastKnownPositionAsync({
          maxAge: STALE_FIX_MS,
        }).catch(() => null);

        if (cached) {
          safeSet({
            status: 'granted',
            coords: { lat: cached.coords.latitude, lng: cached.coords.longitude },
            accuracyMeters: cached.coords.accuracy ?? null,
          });
        }

        // `getCurrentPositionAsync` can hang indefinitely indoors, so race it.
        const position = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS)),
        ]);

        if (!position) {
          // A stale cached fix still beats nothing; only report unavailable
          // when we have literally no position to offer.
          safeSet({
            status: cached ? 'granted' : 'unavailable',
            isLoading: false,
          });
          return cached ? { lat: cached.coords.latitude, lng: cached.coords.longitude } : null;
        }

        const coords: GeoPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        safeSet({
          status: 'granted',
          coords,
          accuracyMeters: position.coords.accuracy ?? null,
          isLoading: false,
        });

        return coords;
      } catch (error) {
        traceError('gps', 'location request threw', {
          message: (error as Error)?.message,
        });
        safeSet({ status: 'unavailable', isLoading: false });
        return null;
      } finally {
        inFlightRef.current = false;
      }
    },
    [safeSet],
  );

  /** Open the OS settings page so the user can grant a blocked permission. */
  const openSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:').catch(() => {});
    } else {
      await Linking.openSettings().catch(() => {});
    }

    // Re-check once the user comes back, so returning with the permission
    // granted updates the UI without them having to tap again.
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        subscription.remove();
        request();
      }
    });
  }, [request]);

  /** Call from a cleanup effect to stop state updates after unmount. */
  const dispose = useCallback(() => {
    mountedRef.current = false;
  }, []);

  return { ...state, request, openSettings, dispose, getStatus };
}

export default useDeviceLocation;
