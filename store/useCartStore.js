import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

const useCartStore = create((set, get) => {
  const updateCartState = (data) => {
    set({
      cartItems: data.products || [],
      totalQuantity: data.totalQuantity || 0,
      totalPrice: data.totalPrice || 0,
      isCartLoading: false,
    });
  };

  const validateToken = (token) => {
    if (!token) throw new Error("لم يتم توفير رمز المصادقة");
  };

  const validateProduct = (product) => {
    if (!product || !product._id) throw new Error("بيانات المنتج غير صحيحة");
  };

  return {
    cartItems: [],
    totalQuantity: 0,
    totalPrice: 0,
    isCartLoading: false,
    errorMessage: null,

    clearError: () => set({ errorMessage: null }),

    getCart: async (token) => {
      try {
        validateToken(token);
        set({ isCartLoading: true, errorMessage: null });

        const response = await axiosInstance.get("/carts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data) throw new Error("لم يتم استلام بيانات من الخادم");
        updateCartState(response.data);
      } catch (error) {
        set({
          isCartLoading: false,
          errorMessage: error.response?.data?.message || error.message || "فشل في تحميل السلة",
        });
      }
    },

    addToCart: async (product, token, selectedSize) => {
      try {
        validateToken(token);
        validateProduct(product);

        const response = await axiosInstance.post(
          "/carts/add",
          {
            productId: product._id,
            quantity: 1,
            size: selectedSize,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data) throw new Error("لم يتم استلام بيانات من الخادم");
        updateCartState(response.data);
      } catch (error) {
        set({
          errorMessage:
            error.response?.data?.message || error.message || "حدث خطأ أثناء إضافة المنتج إلى السلة.",
        });
      }
    },

    updateCartItem: async (product, token, quantity) => {
      try {
        validateToken(token);
        validateProduct(product);
        const normalizedQuantity = quantity > 0 ? 1 : -1;

        await axiosInstance.put(
          "/carts/update",
          {
            productId: product._id,
            quantity: normalizedQuantity,
            size: product.size,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedItems = get().cartItems.map((item) => {
          if (
            item.product._id === product._id &&
            item.size === product.size
          ) {
            const newQty = item.quantity + normalizedQuantity;
            return { ...item, quantity: newQty > 0 ? newQty : 1 };
          }
          return item;
        });

        const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce(
          (sum, item) => sum + item.quantity * item.product.price,
          0
        );

        set({ cartItems: updatedItems, totalQuantity, totalPrice });
      } catch (error) {
        set({
          errorMessage:
            error.response?.data?.message || error.message || "فشل في تحديث المنتج",
        });
      }
    },

    removeFromCart: async (productId, size, token) => {
      try {
        validateToken(token);
        if (!productId || !size) throw new Error("بيانات الحذف غير مكتملة");

        await axiosInstance.put(
          "/carts/update",
          { productId, quantity: 0, size },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedItems = get().cartItems.filter(
          (item) =>
            !(item.product._id === productId && item.size === size)
        );

        const totalQuantity = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = updatedItems.reduce(
          (sum, item) => sum + item.quantity * item.product.price,
          0
        );

        set({ cartItems: updatedItems, totalQuantity, totalPrice });
      } catch (error) {
        set({
          errorMessage:
            error.response?.data?.message || error.message || "فشل في إزالة المنتج من السلة",
        });
      }
    },

    clearCart: async (token) => {
      try {
        validateToken(token);

        await axiosInstance.delete("/carts/delete", {
          headers: { Authorization: `Bearer ${token}` },
        });

        set({ cartItems: [], totalQuantity: 0, totalPrice: 0 });
      } catch (error) {
        set({
          errorMessage:
            error.response?.data?.message || error.message || "فشل في حذف السلة",
        });
      }
    },

    getItemCount: () => get().totalQuantity,
    getCartTotal: () => get().totalPrice,
  };
});

export default useCartStore;
