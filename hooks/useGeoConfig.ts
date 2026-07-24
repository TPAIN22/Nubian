/**
 * Map configuration, fetched once per session and shared by every consumer.
 *
 * This is what makes the provider swappable from the server: tile source,
 * attribution, default centre, capability flags and debounce timings all arrive
 * at runtime. The app ships with no vendor knowledge at all.
 *
 * Never rejects — a failed fetch yields `FALLBACK_GEO_CONFIG`, whose
 * capabilities are all false, so the UI degrades to a coordinate-only picker.
 */
import { useEffect, useRef, useState } from 'react';
import { fetchGeoConfig } from '@/services/geo/geo.api';
import { FALLBACK_GEO_CONFIG, type GeoConfig } from '@/services/geo/types';

/**
 * Module-level cache so several mounted consumers (picker, previews on a list
 * of address cards) share one config and one request.
 */
let cachedConfig: GeoConfig | null = null;

export function useGeoConfig() {
  const [config, setConfig] = useState<GeoConfig>(cachedConfig ?? FALLBACK_GEO_CONFIG);
  const [isLoading, setIsLoading] = useState(!cachedConfig);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (cachedConfig) {
      setIsLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    fetchGeoConfig().then((next) => {
      cachedConfig = next;
      if (mountedRef.current) {
        setConfig(next);
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { config, isLoading };
}

/** Drop the shared config, e.g. on sign-out. */
export const resetGeoConfigCache = () => {
  cachedConfig = null;
};

export default useGeoConfig;
