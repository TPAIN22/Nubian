/**
 * Shared types for the Location Picker presentation layer.
 *
 * `LocationData` is the exact shape the picker emits to consumers (AddressForm,
 * checkout). It must stay identical to the legacy contract — see
 * `components/LocationPicker.tsx`, which re-exports it for backwards compat.
 */

export interface LocationData {
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
}

/** The three cascading levels of the picker. */
export type LocationStep = "country" | "city" | "subcity";

/**
 * A row rendered in any step. The backend returns `nameEn` / `nameAr`; some
 * legacy records carry a flat `name`. Kept loose on purpose so one row type
 * covers countries, cities and sub-cities.
 */
export interface LocationItem {
  _id: string;
  nameEn?: string;
  nameAr?: string;
  name?: string;
  [key: string]: unknown;
}
