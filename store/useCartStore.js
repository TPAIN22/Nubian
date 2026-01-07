// src/store/useCartStore.js
import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans"; // تأكد من المسار الصحيح لـ axiosInstance

const useCartStore = create((set, get) => ({
  cart: null, // سلة التسوق، ستكون null أو كائن السلة من الـ backend
  isLoading: false,
  error: null,
  isUpdating: false,
  clearError: () => set({ error: null }),

  clearCart: () => set({ cart: null }),
  // لجلب السلة من الـ backend
  // Token is automatically added by axios interceptor
  fetchCart: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/carts");
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء جلب السلة.";
      set({
        cart: null,
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // لإضافة منتج إلى السلة
  // Token is automatically added by axios interceptor
  addToCart: async (productId, quantity, size = '') => {
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    try {
      const response = await axiosInstance.post("/carts/add", { productId, quantity, size });
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء إضافة المنتج للسلة.";
      set({
        error: errorMessage,
        isUpdating: false,
      });
      throw error;
    }
  },

  updateCartItemQuantity: async (productId, quantity, size = '') => {
    if (typeof quantity !== 'number' || quantity === 0) {
        set({ error: "قيمة الكمية غير صحيحة." });
        return;
    }
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    
    try {
      const response = await axiosInstance.put("/carts/update", { productId, quantity, size });
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء تحديث السلة.";
      set({
        error: errorMessage,
        isUpdating: false,
      });
      throw error;
    }
  },

  removeFromCart: async (productId, size = '') => {
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    
    try {
      const response = await axiosInstance.delete("/carts/remove", {
        data: { productId, size }
      });
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء حذف المنتج من السلة.";
      set({
        error: errorMessage,
        isUpdating: false,
      });
      throw error;
    }
  },
}));

export default useCartStore;
