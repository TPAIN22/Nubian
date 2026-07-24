/**
 * Debounced reverse geocoding driven by map movement.
 *
 * Three things keep this cheap, in order of impact:
 *   1. Debounce — only the position the map *settles* on is looked up, not
 *      every frame of a pan.
 *   2. A movement threshold — a jitter of a few metres reuses the last answer.
 *   3. The client-side cache in `geo.api` plus the server-side cache behind it.
 *
 * It never surfaces an error: a failed lookup leaves `address` null, which the
 * UI renders as "pin selected, no label". The pin is what gets delivered to.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { reverseGeocode } from '@/services/geo/geo.api';
import { haversineMeters, type GeoAddress, type GeoPoint } from '@/services/geo/types';

interface Options {
  /** Server-tuned, from `/api/geo/config`. */
  debounceMs?: number;
  /** Skip the lookup when the pin moved less than this. */
  minMoveMeters?: number;
  enabled?: boolean;
}

export function useReverseGeocode({
  debounceMs = 500,
  minMoveMeters = 15,
  enabled = true,
}: Options = {}) {
  const [address, setAddress] = useState<GeoAddress | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPointRef = useRef<GeoPoint | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  /**
   * Call when the map settles on a new centre.
   * Safe to call on every `onRegionChangeEnd`.
   */
  const resolve = useCallback(
    (point: GeoPoint) => {
      if (!enabled) return;

      const previous = lastPointRef.current;
      if (previous && haversineMeters(previous, point) < minMoveMeters) {
        return;
      }
      lastPointRef.current = point;

      if (timerRef.current) clearTimeout(timerRef.current);
      // Cancel the in-flight lookup: its answer is for a place the user has
      // already panned away from, and letting it land would overwrite the
      // newer result with a stale one.
      abortRef.current?.abort();

      setIsResolving(true);

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        const result = await reverseGeocode(point.lat, point.lng, controller.signal);

        if (!mountedRef.current || controller.signal.aborted) return;

        setAddress(result);
        setIsResolving(false);
      }, debounceMs);
    },
    [debounceMs, minMoveMeters, enabled],
  );

  /**
   * Adopt an address resolved elsewhere (a search result), without a lookup.
   * Also seeds the movement baseline so settling on the same spot is a no-op.
   */
  const setResolved = useCallback((next: GeoAddress | null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (next) lastPointRef.current = { lat: next.lat, lng: next.lng };
    setAddress(next);
    setIsResolving(false);
  }, []);

  /** Called as soon as a drag starts, so the UI can dim the now-stale label. */
  const markStale = useCallback(() => {
    setIsResolving(true);
  }, []);

  return { address, isResolving, resolve, setResolved, markStale };
}

export default useReverseGeocode;
