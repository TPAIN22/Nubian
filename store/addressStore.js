import { create } from 'zustand';
import axiosInstance from '@/utils/axiosInstans';

const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  // جلب العناوين من الباكند
  fetchAddresses: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get('/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ addresses: res.data, isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // إضافة عنوان
  addAddress: async (address, token) => {
    set({ isLoading: true, error: null });
    try {
      // حذف حقل user إذا كان موجوداً
      const { user, ...addressData } = address;
      const res = await axiosInstance.post('/addresses', addressData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ addresses: [res.data, ...get().addresses], isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تعديل عنوان
  updateAddress: async (id, address, token) => {
    set({ isLoading: true, error: null });
    try {
      // حذف حقل user إذا كان موجوداً
      const { user, ...addressData } = address;
      const res = await axiosInstance.put(`/addresses/${id}`, addressData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ addresses: get().addresses.map(a => a._id === id ? res.data : a), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // حذف عنوان
  deleteAddress: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ addresses: get().addresses.filter(a => a._id !== id), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تعيين عنوان كافتراضي
  setDefaultAddress: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.patch(`/addresses/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ addresses: get().addresses.map(a => ({ ...a, isDefault: a._id === id })), isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تنظيف الأخطاء
  clearError: () => set({ error: null }),
}));

export default useAddressStore; 