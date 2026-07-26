/**
 * Address presentation helpers.
 *
 * Every address surface (cards, checkout, the picker's confirm sheet) renders
 * through these, so a map-first address and a legacy one always read the same
 * way and no screen has to know which generation it is holding.
 */
import i18n from '@/utils/i18n';
import type { Address } from '@/store/addressStore';
import type { AddressLabel } from '@/services/geo/types';

const clean = (value: unknown) => String(value ?? '').trim();

const join = (parts: unknown[], separator = ', ') =>
  parts.map(clean).filter(Boolean).join(separator);

/**
 * The primary line: where this address is.
 *
 * Prefers the geocoded `formattedAddress`, then composes from the geocoded
 * fields, then falls back to the legacy hierarchy. Slots are filled
 * individually — a legacy row has `street` but no `city`, so branching on
 * "is this v2" would drop half the line.
 */
export const formatAddressLine = (address: Partial<Address>): string => {
  const formatted = clean(address.formattedAddress);
  if (formatted) return formatted;

  return join([
    address.street,
    address.neighborhood || address.area || address.subCityName,
    address.city || address.cityName,
    address.administrativeArea,
    address.country || address.countryName,
  ]);
};

/**
 * The secondary line: how to find the door once you're on the street.
 * This is the part couriers actually read.
 */
export const formatDeliveryDetails = (address: Partial<Address>): string => {
  const parts: string[] = [];

  if (clean(address.building)) {
    parts.push(`${i18n.t('address_building') || 'Building'} ${clean(address.building)}`);
  }
  if (clean(address.floor)) {
    parts.push(`${i18n.t('address_floor') || 'Floor'} ${clean(address.floor)}`);
  }
  if (clean(address.apartment)) {
    parts.push(`${i18n.t('address_apartment') || 'Apt'} ${clean(address.apartment)}`);
  }
  if (clean(address.landmark)) {
    parts.push(`${i18n.t('address_near') || 'Near'} ${clean(address.landmark)}`);
  }

  return parts.join(' · ');
};

/** A short title for the card header — the label, or the recipient's name. */
export const formatAddressTitle = (address: Partial<Address>): string => {
  const label = labelText(address.addressLabel);
  const name = clean(address.name);

  if (label && name) return `${label} · ${name}`;
  return label || name || i18n.t('shippingAddress') || 'Delivery address';
};

export const labelText = (label?: AddressLabel | string): string => {
  switch (label) {
    case 'home':
      return i18n.t('address_labelHome') || 'Home';
    case 'work':
      return i18n.t('address_labelWork') || 'Work';
    case 'other':
      return i18n.t('address_labelOther') || 'Other';
    default:
      return '';
  }
};

/** Ionicons name for a label. */
export const labelIcon = (label?: AddressLabel | string): 'home' | 'briefcase' | 'location' => {
  switch (label) {
    case 'home':
      return 'home';
    case 'work':
      return 'briefcase';
    default:
      return 'location';
  }
};

export const ADDRESS_LABELS: AddressLabel[] = ['home', 'work', 'other'];

/** True when this address still needs a pin — drives the "confirm location" nudge. */
export const needsLocationPin = (address: Partial<Address>): boolean =>
  typeof address.latitude !== 'number' || typeof address.longitude !== 'number';

/**
 * True when the shopper should be invited to confirm the pin on a map.
 *
 * Covers both "no pin at all" and "a pin nobody ever looked at" — a migrated or
 * geocoded address has coordinates, but they were derived from text rather than
 * confirmed by a human, so they deserve the same gentle nudge.
 *
 * Keyed on the server-derived `addressConfidence` rather than re-deriving it
 * here, so the rule lives in exactly one place.
 */
export const shouldConfirmLocation = (address: Partial<Address>): boolean => {
  if (needsLocationPin(address)) return true;
  return address.addressConfidence === 'low' || address.addressConfidence === 'medium';
};

/** Human-readable coordinates, shown when there's no geocoded label to show. */
export const formatCoordinates = (
  latitude?: number | null,
  longitude?: number | null,
): string =>
  typeof latitude === 'number' && typeof longitude === 'number'
    ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    : '';
