import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

const useCartStore = create((set, get) => ({
  cartItems: [],
  totalQuantity: 0,
  totalPrice: 0,
  isCartLoading: false,
  errorMessage: null,

  clearError: () => set({ errorMessage: null }),

  getCart: async (token) => {
    if (!token) {
      set({ errorMessage: "لم يتم توفير رمز المصادقة" });
      return;
    }

    try {
      set({ isCartLoading: true, errorMessage: null });
      const response = await axiosInstance.get("/carts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data) {
        throw new Error("لم يتم استلام بيانات من الخادم");
      }

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
          error.response?.data?.message || error.message || "فشل في تحميل السلة",
      });
    }
  },

  addToCart: async (product, token) => {
    if (!token) {
      set({ errorMessage: "لم يتم توفير رمز المصادقة" });
      return;
    }

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

      if (!response.data) {
        throw new Error("لم يتم استلام بيانات من الخادم");
      }

      set({ 
        cartItems: response.data.products || [], 
        totalQuantity: response.data.totalQuantity || 0,
        totalPrice: response.data.totalPrice || 0,
        isCartLoading: false 
      });
    } catch (error) {
      let message = "حدث خطأ أثناء إضافة المنتج إلى السلة.";
      if (error.response?.status === 401) {
        message = "غير مصرح لك بإجراء هذه العملية";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      set({ isCartLoading: false, errorMessage: message });
    }
  },

  updateCartItem: async (product, token, quantity) => {
    if (!token) {
      set({ errorMessage: "لم يتم توفير رمز المصادقة" });
      return;
    }

    if (!product || !product._id) {
      set({ errorMessage: "بيانات المنتج غير صحيحة" });
      return;
    }

    try {
      set({ isCartLoading: true, errorMessage: null });
      const normalizedQuantity = quantity > 0 ? 1 : -1;
      
      const response = await axiosInstance.put(
        "/carts/update",
        { productId: product._id, quantity: normalizedQuantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data) {
        throw new Error("لم يتم استلام بيانات من الخادم");
      }

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
          error.response?.data?.message || error.message || "فشل في تحديث المنتج",
      });
    }
  },

  removeFromCart: async (productId, token) => {
    if (!token) {
      set({ errorMessage: "لم يتم توفير رمز المصادقة" });
      return;
    }

    if (!productId) {
      set({ errorMessage: "معرف المنتج غير صحيح" });
      return;
    }

    try {
      set({ isCartLoading: true, errorMessage: null });

      const response = await axiosInstance.put(
        "/carts/update",
        { productId, quantity: 0 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data) {
        throw new Error("لم يتم استلام بيانات من الخادم");
      }

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
          error.response?.data?.message || error.message || "فشل في إزالة المنتج من السلة",
      });
    }
  },

  clearCart: async (token) => {
    if (!token) {
      set({ errorMessage: "لم يتم توفير رمز المصادقة" });
      return;
    }

    try {
      set({ isCartLoading: true, errorMessage: null });

      await axiosInstance.delete("/carts/delete", {
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
          error.response?.data?.message || error.message || "فشل في حذف السلة",
      });
    }
  },

  getItemCount: () => {
    return get().totalQuantity;
  },

  getCartTotal: () => {
    return get().totalPrice;
  }
}));

export default useCartStore;