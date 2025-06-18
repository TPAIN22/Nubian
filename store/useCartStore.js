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
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/carts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // الـ backend يرسل السلة مباشرة في response.data
      set({ cart: response.data, isLoading: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred while fetching the cart.";
      set({
        cart: null, // مسح السلة عند الخطأ
        error: errorMessage,
        isLoading: false,
      });
      throw error; // إعادة رمي الخطأ للسماح للمكونات بمعالجته إذا لزم الأمر
    }
  },

  // لإضافة منتج إلى السلة
  addToCart: async (token, productId, quantity, size = '') => {
    if (!token) {
      return;
    }
    set({ isUpdating: true, error: null });
    try {
      const response = await axiosInstance.post("/carts/add", { productId, quantity, size }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ cart: response.data, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred while adding the product to the cart.";
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
        set({ error: "Invalid quantity  value." });
        return;
    }
    set({ isUpdating: true, error: null });
    try {
      const response = await axiosInstance.put("/carts/update", { productId, quantity, size }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ cart: response.data, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred while updating the cart.";
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
    set({ isUpdating: true, error: null });
    try {
      // استخدام نقطة نهاية DELETE المخصصة للحذف
      const response = await axiosInstance.delete("/carts/remove", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { productId, size } // لطلبات DELETE مع body
      });
      set({ cart: response.data, isUpdating: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "An error occurred while removing the product from the cart.";
      set({
        error: errorMessage,
        isUpdating: false,
      });
      throw error;
    }
  },
}));
