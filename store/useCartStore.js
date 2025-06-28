// src/store/useCartStore.js
import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans"; // تأكد من المسار الصحيح لـ axiosInstance

export const useCartStore = create((set, get) => ({
  cart: null, // سلة التسوق، ستكون null أو كائن السلة من الـ backend
  isLoading: false,
  error: null,
  isUpdating: false,
  clearError: () => set({ error: null }),

  clearCart: () => set({ cart: null }),
  // لجلب السلة من الـ backend
  fetchCart: async (token) => {
    if (!token) {
      set({ cart: null, isLoading: false, error: null }); 
      return;
    }
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/carts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
  addToCart: async (token, productId, quantity, size = '') => {
    if (!token) {
      return;
    }
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    try {
      const response = await axiosInstance.post("/carts/add", { productId, quantity, size }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  updateCartItemQuantity: async (token, productId, quantity, size = '') => {
    if (!token) {
      return;
    }
    if (typeof quantity !== 'number' || quantity === 0) {
        set({ error: "قيمة الكمية غير صحيحة." });
        return;
    }
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    
    
    try {
      const response = await axiosInstance.put("/carts/update", { productId, quantity, size }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  removeFromCart: async (token, productId, size = '') => {
    if (!token) {
      return;
    }
    if (get().isUpdating) return;
    set({ isUpdating: true, error: null });
    
    
    try {
      const response = await axiosInstance.delete("/carts/remove", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
