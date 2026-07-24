/**
 * Client for the backend's provider-neutral geo proxy.
 *
 * Every call goes to `/api/geo/*`. No vendor SDK, no vendor key, no vendor URL
 * anywhere in the app — that is what makes swapping providers a server-side
 * decision.
 *
 * Failure policy: search and reverse geocoding degrade to empty results rather
 * than throwing. Address entry must survive a flaky network or a provider
 * outage, because the pin itself is the deliverable part.
 */
import axiosInstance from '@/services/api/client';
import i18n from '@/utils/i18n';
import { trace, traceError } from '@/components/map/trace';
import {
  FALLBACK_GEO_CONFIG,
  type GeoAddress,
  type GeoConfig,
  type GeoSuggestion,
} from './types';

/** Backend responses are wrapped in the standard `{ success, data }` envelope. */
const unwrap = <T,>(payload: any, fallback: T): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload.data ?? fallback) as T;
  }
  return (payload ?? fallback) as T;
};

const currentLanguage = () => (i18n.language === 'ar' ? 'ar' : 'en');

/**
 * In-memory result cache.
 *
 * Reverse geocoding is billed per call and a shopper dragging the map re-asks
 * about the same block constantly. Coordinates are snapped to ~11 m so small
 * drags reuse the answer. Cleared on app restart, which is the right lifetime
 * for something this cheap to refetch.
 */
const CACHE_LIMIT = 200;
const cache = new Map<string, unknown>();

const cacheGet = <T,>(key: string): T | undefined => cache.get(key) as T | undefined;

const cacheSet = (key: string, value: unknown) => {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
};

const snap = (value: number, precision = 4) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

/** Collapse identical concurrent requests into one. */
const inFlight = new Map<string, Promise<unknown>>();

const coalesce = <T,>(key: string, factory: () => Promise<T>): Promise<T> => {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
};

/* ── Config ───────────────────────────────────────────────────────────────── */

let configPromise: Promise<GeoConfigResult> | null = null;

export interface GeoConfigResult {
  config: GeoConfig;
  /**
   * True only when the backend actually answered.
   *
   * Callers must not memoise a config with `fromServer: false` — doing so pins
   * the whole session to the no-basemap fallback, so a backend that comes back
   * up (or a token that arrives late) never gets picked up without an app
   * restart. It reads exactly like a dead map.
   */
  fromServer: boolean;
}

/**
 * Fetch the map configuration.
 *
 * Never rejects: a failure resolves with `FALLBACK_GEO_CONFIG` and
 * `fromServer: false`, so the picker renders a coordinate-only experience
 * instead of a broken screen — but the caller can tell the difference and retry.
 */
export const fetchGeoConfig = (): Promise<GeoConfigResult> => {
  if (configPromise) return configPromise;

  trace('config', 'GET /geo/config …', { baseURL: axiosInstance.defaults.baseURL });

  configPromise = axiosInstance
    .get('/geo/config')
    .then((res) => {
      const config = { ...FALLBACK_GEO_CONFIG, ...unwrap<Partial<GeoConfig>>(res.data, {}) };

      trace('config', 'resolved', {
        provider: config.provider,
        basemap: config.basemap,
        tileUrl: config.tileUrl,
        capabilities: config.capabilities,
        defaultCenter: config.defaultCenter,
      });

      if (config.basemap === 'none') {
        traceError(
          'config',
          'backend answered but basemap="none" — the picker will show a ' +
            'coordinate-only placeholder. The provider is unconfigured: check ' +
            'GEO_PROVIDER and its API key on the backend.',
          { provider: config.provider },
        );
      }

      return { config, fromServer: true };
    })
    .catch((error) => {
      // Don't memoise a failure — the next screen open should retry.
      configPromise = null;

      traceError('config', 'GET /geo/config FAILED — falling back to a no-basemap config', {
        status: error?.response?.status,
        message: error?.message,
        // 401 here almost always means the Clerk token wasn't attached yet.
        hint:
          error?.response?.status === 401
            ? 'unauthenticated — is the auth token attached?'
            : 'is the backend reachable from the device? (localhost != device)',
      });

      return { config: FALLBACK_GEO_CONFIG, fromServer: false };
    });

  return configPromise;
};

/* ── Reverse geocoding ────────────────────────────────────────────────────── */

/**
 * Coordinates → address.
 *
 * Returns null when the lookup fails. Callers must treat that as "no label
 * yet", never as "invalid location" — the pin is still perfectly saveable.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeoAddress | null> => {
  const language = currentLanguage();
  const key = `rev:${language}:${snap(lat)},${snap(lng)}`;

  const cached = cacheGet<GeoAddress>(key);
  if (cached) return cached;

  return coalesce(key, async () => {
    try {
      const res = await axiosInstance.get('/geo/reverse', {
        params: { lat, lng, language },
        signal,
      });

      const address = unwrap<GeoAddress | null>(res.data, null);
      if (address?.formattedAddress) cacheSet(key, address);
      return address;
    } catch {
      return null;
    }
  });
};

/* ── Search ───────────────────────────────────────────────────────────────── */

/**
 * Type-ahead search over cities, streets, landmarks, businesses and
 * neighbourhoods. Biased toward `near` when supplied.
 *
 * Always resolves to an array — an empty list reads as "no results" in the UI,
 * which is the correct thing to show whether the query genuinely matched
 * nothing or the provider is down.
 */
export const searchPlaces = async (
  query: string,
  near?: { lat: number; lng: number } | null,
  signal?: AbortSignal,
): Promise<GeoSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const language = currentLanguage();
  const nearKey = near ? `${snap(near.lat, 2)},${snap(near.lng, 2)}` : '-';
  const key = `search:${language}:${nearKey}:${trimmed.toLowerCase()}`;

  const cached = cacheGet<GeoSuggestion[]>(key);
  if (cached) return cached;

  return coalesce(key, async () => {
    try {
      const res = await axiosInstance.get('/geo/search', {
        params: {
          q: trimmed,
          language,
          ...(near ? { lat: near.lat, lng: near.lng } : {}),
        },
        signal,
      });

      const results = unwrap<GeoSuggestion[]>(res.data, []);
      if (results.length) cacheSet(key, results);
      return results;
    } catch {
      return [];
    }
  });
};

/**
 * Resolve a search suggestion into a full address with coordinates.
 * Returns null if the place can't be resolved, so the caller can fall back to
 * the suggestion's inline coordinates when it has them.
 */
export const getPlaceDetails = async (placeId: string): Promise<GeoAddress | null> => {
  const language = currentLanguage();
  const key = `place:${language}:${placeId}`;

  const cached = cacheGet<GeoAddress>(key);
  if (cached) return cached;

  return coalesce(key, async () => {
    try {
      const res = await axiosInstance.get(
        `/geo/place/${encodeURIComponent(placeId)}`,
        { params: { language } },
      );

      const address = unwrap<GeoAddress | null>(res.data, null);
      if (address) cacheSet(key, address);
      return address;
    } catch {
      return null;
    }
  });
};

/** Test seam / logout hook — drops cached lookups and the memoised config. */
export const clearGeoCache = () => {
  cache.clear();
  inFlight.clear();
  configPromise = null;
};
