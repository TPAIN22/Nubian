import { create } from "zustand";
import axiosInstance from "@/services/api/client";
import { describeError } from "@/utils/apiError";
import i18n from "@/utils/i18n";
import type { AddressConfidence, AddressLabel, LocationSource } from "@/services/geo/types";

/**
 * Dedupe key.
 *
 * For a pinned address the coordinates *are* the identity — two saves of the
 * same pin are the same address however the label came out. Legacy rows have no
 * pin, so they fall back to the old text-based key.
 */
const addressKey = (a: Partial<Address>): string => {
  if (typeof a.latitude === "number" && typeof a.longitude === "number") {
    return `${a.latitude.toFixed(5)},${a.longitude.toFixed(5)}|${String(a.building ?? "").trim().toLowerCase()}`;
  }
  return [a.name, a.city, a.area, a.street, a.building, a.phone]
    .map((v) => String(v ?? "").trim().toLowerCase())
    .join("|");
};

/* ================= TYPES ================= */

export interface Address {
  _id: string;

  /* ── Map-first ──────────────────────────────────────────────────────────
   * `latitude` / `longitude` are virtuals the API projects from the stored
   * GeoJSON point. They are null on legacy addresses that were never pinned. */
  latitude?: number | null;
  longitude?: number | null;
  hasCoordinates?: boolean;

  formattedAddress?: string;
  placeId?: string;
  /** Open Location Code, when the active provider exposes one. Optional. */
  plusCode?: string;
  geoProvider?: string;

  countryCode?: string;
  country?: string;
  administrativeArea?: string;
  subAdministrativeArea?: string;
  neighborhood?: string;
  postalCode?: string;

  /** Shopper-entered detail — this is what actually gets a courier to the door. */
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;

  addressLabel?: AddressLabel;
  locationSource?: LocationSource;
  /** Server-derived. Read-only here — used to nudge low-confidence addresses. */
  addressConfidence?: AddressConfidence;
  geocodeAccuracy?: string;
  /** Reported pin accuracy in metres; null when the platform gave none. */
  locationAccuracyMeters?: number | null;

  /** True for rows migrated from the old hierarchy that still have no pin. */
  isLegacy?: boolean;
  schemaVersion?: number;

  /* ── Shared ─────────────────────────────────────────────────────────── */
  name?: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  city: string;
  street: string;
  isDefault?: boolean;

  /* ── Legacy hierarchy ───────────────────────────────────────────────────
   * Still returned by the API and still rendered as a fallback for addresses
   * that predate the map. Never written by the new flow. */
  area?: string;
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;

  createdAt?: string;
  updatedAt?: string;
}

/** The payload the map-first flow sends. Derived fields are the server's job. */
export interface AddressDraft {
  latitude: number;
  longitude: number;
  placeId?: string;
  name?: string;
  phone: string;
  whatsapp?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  notes?: string;
  addressLabel?: AddressLabel;
  locationSource?: LocationSource;
  /** Only meaningful for a device fix; the server drops it for other sources. */
  locationAccuracyMeters?: number | null;
  isDefault?: boolean;
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  inFlight: Promise<Address[]> | null;

  fetchAddresses: () => Promise<Address[]>;
  addAddress: (address: Partial<Address> | AddressDraft) => Promise<Address>;
  updateAddress: (id: string, address: Partial<Address> | AddressDraft) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  getById: (id: string | null | undefined) => Address | undefined;
  clearError: () => void;
}

/** Strip client-only keys the API would reject or ignore. */
const toPayload = (address: Partial<Address> | AddressDraft) => {
  const {
    // never sent
    _id,
    user,
    hasCoordinates,
    geoProvider,
    geocodeAccuracy,
    isLegacy,
    schemaVersion,
    createdAt,
    updatedAt,
    // server-derived from the pin — sending them would let the client claim a
    // pin is somewhere it isn't, or assert its own trustworthiness
    formattedAddress,
    countryCode,
    country,
    administrativeArea,
    subAdministrativeArea,
    neighborhood,
    postalCode,
    city,
    plusCode,
    addressConfidence,
    ...rest
  } = address as any;

  return rest;
};

/* ================= STORE ================= */

const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
  isSaving: false,
  error: null,
  inFlight: null,

  /* ===== FETCH ===== */
  fetchAddresses: async () => {
    const { isLoading, inFlight } = get();
    if (isLoading && inFlight) return inFlight;

    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const res = await axiosInstance.get<Address[]>("/addresses");

        const data = Array.isArray(res.data) ? res.data : [];

        set({
          addresses: data,
          isLoading: false,
          error: null,
        });

        return data;
      } catch (error: any) {
        const msg = error?.response?.data?.message || error.message;

        set({
          error: msg,
          isLoading: false,
        });

        throw error;
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });

    return task;
  },

  /* ===== ADD ===== */
  addAddress: async (address) => {
    set({ isSaving: true, error: null });

    try {
      const res = await axiosInstance.post<Address>("/addresses", toPayload(address));

      const newAddress = res.data;
      const currentAddresses = Array.isArray(get().addresses) ? get().addresses : [];

      // Dedupe: if the server returned an address matching an existing one
      // (same key OR same _id), replace rather than prepend a duplicate.
      const newKey = addressKey(newAddress);
      const filtered = currentAddresses.filter(
        (a) => a._id !== newAddress._id && addressKey(a) !== newKey,
      );

      // Saving a new default demotes the others; reflect that locally rather
      // than refetching the whole list.
      const next = newAddress.isDefault
        ? [newAddress, ...filtered.map((a) => ({ ...a, isDefault: false }))]
        : [newAddress, ...filtered];

      set({ addresses: next, isSaving: false });

      return newAddress;
    } catch (error: any) {
      set({ error: describeError(error), isSaving: false });
      throw error;
    }
  },

  /* ===== UPDATE ===== */
  updateAddress: async (id, address) => {
    // Every edit path in the app collects a phone number, so an update without
    // one means a caller built a partial payload by mistake. Checkout hard-
    // requires `address.phone`, so letting it through would produce an address
    // that silently can't be ordered to.
    if (!String((address as any).phone ?? "").trim()) {
      set({ error: i18n.t("addressForm_phoneRequired") || "Phone number is required" });
      return false;
    }

    set({ isSaving: true, error: null });

    try {
      const res = await axiosInstance.put<Address>(`/addresses/${id}`, toPayload(address));

      const updated = res.data;
      const currentAddresses = get().addresses ?? [];

      set({
        addresses: currentAddresses.map((a) => {
          if (a._id === id) return updated;
          return updated.isDefault ? { ...a, isDefault: false } : a;
        }),
        isSaving: false,
      });

      return true;
    } catch (error: any) {
      set({ error: describeError(error), isSaving: false });
      return false;
    }
  },

  /* ===== DELETE ===== */
  deleteAddress: async (id) => {
    set({ isSaving: true, error: null });

    try {
      const wasDefault = get().addresses.find((a) => a._id === id)?.isDefault;

      await axiosInstance.delete(`/addresses/${id}`);

      set({
        addresses: get().addresses.filter((a) => a._id !== id),
        isSaving: false,
      });

      // The server promotes a replacement default; refetch to learn which.
      // Past orders are unaffected — each froze its own address snapshot.
      if (wasDefault) {
        await get().fetchAddresses();
      }

      return true;
    } catch (error: any) {
      set({ error: describeError(error), isSaving: false });
      return false;
    }
  },

  /* ===== SET DEFAULT ===== */
  setDefaultAddress: async (id) => {
    const previous = get().addresses;

    // Optimistic: the badge should move the instant it is tapped.
    set({
      addresses: previous.map((a) => ({ ...a, isDefault: a._id === id })),
      error: null,
    });

    try {
      await axiosInstance.patch(`/addresses/${id}/default`, {});
      return true;
    } catch (error: any) {
      set({ addresses: previous, error: describeError(error) });
      return false;
    }
  },

  getById: (id) => (id ? get().addresses.find((a) => a._id === id) : undefined),

  /* ===== CLEAR ERROR ===== */
  clearError: () => set({ error: null }),
}));

export default useAddressStore;
