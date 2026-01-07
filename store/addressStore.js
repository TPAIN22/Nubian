import { create } from 'zustand';
import axiosInstance from '@/utils/axiosInstans';

const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  // جلب العناوين من الباكند
  // Token is automatically added by axios interceptor
  fetchAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get('/addresses');
      set({ addresses: res.data, isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // إضافة عنوان
  // Token is automatically added by axios interceptor
  addAddress: async (address) => {
    set({ isLoading: true, error: null });
    try {
      // حذف حقل user إذا كان موجوداً
      const { user, ...addressData } = address;
      const res = await axiosInstance.post('/addresses', addressData);
      set({ addresses: [res.data, ...get().addresses], isLoading: false });
    } catch (error) {
      set({ error: error?.response?.data?.message || error.message, isLoading: false });
    }
  },

  // تعديل عنوان
  // Token is automatically added by axios interceptor
  updateAddress: async (id, address) => {
    set({ isLoading: true, error: null });
    try {
      // حذف حقل user إذا كان موجوداً
      const { user, ...addressData } = address;
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