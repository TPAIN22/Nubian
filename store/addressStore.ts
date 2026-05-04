import { create } from "zustand";
import axiosInstance from "@/services/api/client";

/* ================= TYPES ================= */

export interface Address {
  _id: string;
  city: string;
  street: string;
  phone: string;
  isDefault?: boolean;

  // Optional UI / form fields
  name?: string;
  area?: string;
  building?: string;
  notes?: string;

  // Location selection (provided by LocationPicker)
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;

  [key: string]: any; // لو عندك حقول إضافية
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  inFlight: Promise<Address[]> | null;

  fetchAddresses: () => Promise<Address[]>;
  addAddress: (address: Partial<Address>) => Promise<Address>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  clearError: () => void;
}

/* ================= STORE ================= */

const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,
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
    set({ isLoading: true, error: null });

    try {
      const { user, ...addressData } = address;

      const res = await axiosInstance.post<Address>(
        "/addresses",
        addressData
      );

      const newAddress = res.data;
      const currentAddresses = Array.isArray(get().addresses)
        ? get().addresses
        : [];

      set({
        addresses: [newAddress, ...currentAddresses],
        isLoading: false,
      });

      return newAddress;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message;

      set({
        error: msg,
        isLoading: false,
      });

      throw error;
    }
  },

  /* ===== UPDATE ===== */
  updateAddress: async (id, address) => {
    set({ isLoading: true, error: null });

    try {
      const { user, ...addressData } = address;

      if (!addressData.phone) {
        throw new Error("رقم الهاتف مطلوب");
      }

      const res = await axiosInstance.put<Address>(
        `/addresses/${id}`,
        addressData
      );

      const currentAddresses = get().addresses ?? [];

      set({
        addresses: currentAddresses.map((a) =>
          a._id === id ? res.data : a
        ),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  /* ===== DELETE ===== */
  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const wasDefault = get().addresses.find((a) => a._id === id)?.isDefault;

      await axiosInstance.delete(`/addresses/${id}`);

      set({
        addresses: get().addresses.filter((a) => a._id !== id),
        isLoading: false,
      });

      if (wasDefault) {
        await get().fetchAddresses();
      }
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  /* ===== SET DEFAULT ===== */
  setDefaultAddress: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await axiosInstance.patch(`/addresses/${id}/default`, {});

      set({
        addresses: get().addresses.map((a) => ({
          ...a,
          isDefault: a._id === id,
        })),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || error.message,
        isLoading: false,
      });
    }
  },

  /* ===== CLEAR ERROR ===== */
  clearError: () => set({ error: null }),
}));

export default useAddressStore;