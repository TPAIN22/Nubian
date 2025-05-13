import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

const useCartStore = create((set, get) => ({
  cartItems: [],
  totalQuantity: 0,
  totalPrice: 0,
  isCartLoading: false,
  errorMessage: null,

  getCart: async (token) => {
    try {
      set({ isCartLoading: true, errorMessage: null });
      const response = await axiosInstance.get("/carts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ 
        cartItems: response.data.products || [], 
        totalQuantity: response.data.totalQuantity || 0,
        totalPrice: response.data.totalPrice || 0,
        isCartLoading: false 
      });
    } catch (error) {
      set({
        isCartLoading: false,
        errorMessage:
          error.response?.data?.message || "فشل في تحميل السلة",
      });
    }
  },

  addToCart: async (product, token) => {
    try {
      set({ isCartLoading: true, errorMessage: null });
      if (!product || !product._id) {
        throw new Error("بيانات المنتج غير صحيحة");
      }

      const response = await axiosInstance.post(
        "/carts/add",
        { productId: product._id, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      set({ 
        cartItems: response.data.products || [], 
        totalQuantity: response.data.totalQuantity || 0,
        totalPrice: response.data.totalPrice || 0,
        isCartLoading: false 
      });
    } catch (error) {
      let message = "حدث خطأ أثناء إضافة المنتج إلى السلة.";
      if (error.response?.status === 401) {
        message = error.response.data.message;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      set({ isCartLoading: false, errorMessage: message });
    }
  },

  updateCartItem: async (productId, quantity, token) => {
    try {
      set({ isCartLoading: true, errorMessage: null });

      const response = await axiosInstance.put(
        "/carts/update",
        { productId, quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // تحديث كل بيانات السلة من الاستجابة
      set({ 
        cartItems: response.data.products || [], 
        totalQuantity: response.data.totalQuantity || 0,
        totalPrice: response.data.totalPrice || 0,
        isCartLoading: false 
      });
    } catch (error) {
      set({
        isCartLoading: false,
        errorMessage:
          error.response?.data?.message || "فشل في تحديث المنتج",
      });
    }
  },

  removeFromCart: async (productId, token) => {
    try {
      set({ isCartLoading: true, errorMessage: null });

      const response = await axiosInstance.put(
        "/carts/update",
        { productId, quantity: 0 }, // استخدام quantity=0 للإزالة
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // تحديث كل بيانات السلة من الاستجابة
      set({ 
        cartItems: response.data.products || [], 
        totalQuantity: response.data.totalQuantity || 0,
        totalPrice: response.data.totalPrice || 0,
        isCartLoading: false 
      });
    } catch (error) {
      set({
        isCartLoading: false,
        errorMessage:
          error.response?.data?.message || "فشل في إزالة المنتج من السلة",
      });
    }
  },

  clearCart: async (token) => {
    try {
      set({ isCartLoading: true, errorMessage: null });

      await axiosInstance.delete("/carts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({ 
        cartItems: [], 
        totalQuantity: 0,
        totalPrice: 0,
        isCartLoading: false 
      });
    } catch (error) {
      set({
        isCartLoading: false,
        errorMessage:
          error.response?.data?.message || "فشل في حذف السلة",
      });
    }
  },

  // طرق مساعدة تعمل على الجانب العميل بدون طلبات للخادم
  getItemCount: () => {
    return get().totalQuantity;
  },

  getCartTotal: () => {
    return get().totalPrice;
  }
}));

export default useCartStore;