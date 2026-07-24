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
 * Map configuration served by the backend at boot.
 *
 * `tileUrl` / `styleUrl` are what let the map render without the app knowing
 * which vendor is behind it. `capabilities` lets the UI hide affordances the
 * active provider cannot back — e.g. no search bar when autocomplete is off.
 */
export interface GeoConfig {
  provider: string;
  styleUrl: string | null;
  tileUrl: string | null;
  attribution: string;
  maxZoom: number;
  defaultCenter: GeoPoint;
  defaultZoom: number;
  capabilities: GeoCapabilities;
  countryCodes: string[];
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
