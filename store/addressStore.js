import { create } from 'zustand';
import axiosInstance from "@/services/api/client";

const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,
  inFlight: null,

  // جلب العناوين من الباكند
  fetchAddresses: async () => {
    const { isLoading, inFlight } = get();
    if (isLoading && inFlight) return inFlight;

    set({ isLoading: true, error: null });
    const task = (async () => {
      try {
        const res = await axiosInstance.get('/addresses');
        set({ addresses: res.data, isLoading: false, error: null });
        return res.data;
      } catch (error) {
        const msg = error?.response?.data?.message || error.message;
        set({ error: msg, isLoading: false });
        throw error;
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });
    return task;
  },

  // إضافة عنوان
  // Token is automatically added by axios interceptor
  addAddress: async (address) => {
    set({ isLoading: true, error: null });
    try {
      const { user, ...addressData } = address;
      const res = await axiosInstance.post('/addresses', addressData);
      const newAddress = res.data;
      set({ addresses: [newAddress, ...get().addresses], isLoading: false });
      return newAddress;
    } catch (error) {
      const msg = error?.response?.data?.message || error.message;
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  // تعديل عنوان
  // Token is automatically added by axios interceptor
  updateAddress: async (id, address) => {
    set({ isLoading: true, error: null });
    try {
      const { user, ...addressData } = address;
      if (!addressData.phone || !addressData.whatsapp) {
        throw new Error("رقم الهاتف وواتساب مطلوبان");
      }
      const res = await axiosInstance.put(`/addresses/${id}`, addressData);
      set({ addresses: get().addresses.map(a => a._id === id ? res.data : a), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // حذف عنوان
  // Token is automatically added by axios interceptor
  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/addresses/${id}`);
      set({ addresses: get().addresses.filter(a => a._id !== id), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تعيين عنوان كافتراضي
  // Token is automatically added by axios interceptor
  setDefaultAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.patch(`/addresses/${id}/default`, {});
      set({ addresses: get().addresses.map(a => ({ ...a, isDefault: a._id === id })), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تنظيف الأخطاء
  clearError: () => set({ error: null }),
}));

export default useAddressStore; 