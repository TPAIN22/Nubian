/**
 * Map configuration, shared by every consumer.
 *
 * This is what makes the provider swappable from the server: tile source,
 * attribution, default centre, capability flags and debounce timings all arrive
 * at runtime. The app ships with no vendor knowledge at all.
 *
 * Never rejects — a failed fetch yields `FALLBACK_GEO_CONFIG`, whose
 * capabilities are all false, so the UI degrades to a coordinate-only picker.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchGeoConfig } from '@/services/geo/geo.api';
import { FALLBACK_GEO_CONFIG, type GeoConfig } from '@/services/geo/types';
import { trace } from '@/components/map/trace';

/**
 * Module-level cache so several mounted consumers (picker, previews on a list
 * of address cards) share one config and one request.
 *
 * **Only a config that actually came from the backend is cached.** Caching the
 * failure fallback would pin the entire session to `basemap: 'none'`: a backend
 * that was briefly unreachable — or an auth token that arrived a moment late —
 * would leave the map permanently dead with no retry and no request in the
 * network log, which is indistinguishable from a broken map.
 */
let cachedConfig: GeoConfig | null = null;

export function useGeoConfig() {
  const [config, setConfig] = useState<GeoConfig>(cachedConfig ?? FALLBACK_GEO_CONFIG);
  const [isLoading, setIsLoading] = useState(!cachedConfig);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    const { config: next, fromServer } = await fetchGeoConfig();

    if (fromServer) {
      cachedConfig = next;
    } else {
      trace('config', 'not caching the fallback — will retry on next mount');
    }

    if (mountedRef.current) {
      setConfig(next);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (cachedConfig) {
      trace('config', 'using cached config', { provider: cachedConfig.provider });
      setIsLoading(false);
    } else {
      load();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  /** Force a re-fetch, e.g. from a retry button. */
  const refresh = useCallback(() => {
    cachedConfig = null;
    setIsLoading(true);
    return load();
  }, [load]);

  return { config, isLoading, refresh };
}

/** Drop the shared config, e.g. on sign-out. */
export const resetGeoConfigCache = () => {
  cachedConfig = null;
};

export default useGeoConfig;
