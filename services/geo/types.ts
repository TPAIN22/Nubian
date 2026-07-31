/**
 * Vendor-neutral geo types — the mobile mirror of the backend's
 * `services/geo/types.js`.
 *
 * The app never talks to a map vendor directly. Everything goes through
 * `/api/geo/*`, which means switching provider is a backend env change and
 * costs zero app releases. Nothing in this file may name a vendor.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoAddress {
  lat: number;
  lng: number;
  formattedAddress: string;
  countryCode: string;
  country: string;
  administrativeArea: string;
  subAdministrativeArea: string;
  city: string;
  neighborhood: string;
  street: string;
  streetNumber: string;
  postalCode: string;
  placeId: string;
  /** Open Location Code. '' whenever the active provider doesn't expose one. */
  plusCode: string;
  provider: string;
  accuracy: 'exact' | 'interpolated' | 'approximate' | 'unknown';
}

export interface GeoSuggestion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  provider: string;
  lat: number | null;
  lng: number | null;
  distanceMeters: number | null;
}

export interface GeoCapabilities {
  reverseGeocode: boolean;
  forwardGeocode: boolean;
  autocomplete: boolean;
  placeDetails: boolean;
  staticMap: boolean;
}

/**
 * The area the platform delivers to, as served by the backend.
 *
 * The app uses this only to fail *early* — greying out the confirm button
 * before the shopper fills in a whole address form. It is never the enforcement
 * point: the server re-checks the pin on save and again at checkout, because
 * anything shipped to a device can be edited.
 *
 * `enabled: false` means no coverage is configured and everywhere is allowed.
 */
export interface GeoServiceArea {
  enabled: boolean;
  /** Zone names, for telling the shopper where we *do* deliver. */
  names: string[];
  /** The same names in Arabic, so the message doesn't switch script mid-sentence. */
  namesAr: string[];
  /** GeoJSON MultiPolygon, coordinates as [lng, lat]. Null when disabled. */
  geometry: { type: 'MultiPolygon'; coordinates: number[][][][] } | null;
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number } | null;
}

/**
 * Map configuration served by the backend at boot.
 *
 * `tileUrl` / `styleUrl` are what let the map render without the app knowing
 * which vendor is behind it. `capabilities` lets the UI hide affordances the
 * active provider cannot back — e.g. no search bar when autocomplete is off.
 */
export interface GeoConfig {
  provider: string;
  /**
   * How the client should draw the basemap, without naming a vendor.
   * 'native' means the provider's tiles are only licensed through its platform
   * SDK, so the renderer must use its own native basemap.
   */
  basemap: 'raster' | 'vector' | 'native' | 'none';
  styleUrl: string | null;
  tileUrl: string | null;
  attribution: string;
  maxZoom: number;
  defaultCenter: GeoPoint;
  defaultZoom: number;
  capabilities: GeoCapabilities;
  countryCodes: string[];
  /** Where the platform delivers. See `GeoServiceArea`. */
  serviceArea: GeoServiceArea;
  /** Server-tuned debounce for reverse geocoding after the map settles. */
  reverseGeocodeDebounceMs: number;
  /** Server-tuned debounce for the search box. */
  searchDebounceMs: number;
}

export type AddressLabel = 'home' | 'work' | 'other';

export type LocationSource =
  | 'gps'
  | 'map_pin'
  | 'search'
  | 'geocoded'
  | 'migrated'
  | 'legacy'
  | 'manual';

/**
 * How reliable an address is for delivery.
 *
 * Always derived by the server from how the pin was obtained — the app reads it
 * (to decide whether to nudge the shopper to confirm their location) and never
 * sends it.
 */
export type AddressConfidence = 'high' | 'medium' | 'low';

/** Fallback config used before `/api/geo/config` responds, and if it never does. */
export const FALLBACK_GEO_CONFIG: GeoConfig = {
  provider: 'none',
  basemap: 'none',
  styleUrl: null,
  tileUrl: null,
  attribution: '',
  maxZoom: 19,
  defaultCenter: { lat: 15.5007, lng: 32.5599 }, // Khartoum
  defaultZoom: 15,
  capabilities: {
    reverseGeocode: false,
    forwardGeocode: false,
    autocomplete: false,
    placeDetails: false,
    staticMap: false,
  },
  countryCodes: [],
  // Unrestricted until the server says otherwise. A config fetch that failed
  // must never invent a boundary and lock the shopper out of saving anything —
  // the server gates still hold, so the honest client default is "allow".
  serviceArea: { enabled: false, names: [], namesAr: [], geometry: null, bbox: null },
  reverseGeocodeDebounceMs: 500,
  searchDebounceMs: 350,
};

export const isValidCoordinate = (lat?: number | null, lng?: number | null): boolean =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);

/** Great-circle distance in metres. Used for "did the pin actually move" checks. */
export const haversineMeters = (a: GeoPoint, b: GeoPoint): number => {
  const R = 6371008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
