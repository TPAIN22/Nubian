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
      console.log('Fetch cart request:', {
        url: '/carts',
        baseURL: axiosInstance.defaults.baseURL,
        fullURL: `${axiosInstance.defaults.baseURL}/carts`,
      });
      
      const response = await axiosInstance.get("/carts");
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isLoading: false });
    } catch (error) {
      console.error('Fetch cart error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      });
      
      // Handle 404 (cart not found) as empty cart, not an error
      if (error.response?.status === 404) {
        const errorMessage = error.response?.data?.message || '';
        console.log('404 error details:', {
          errorMessage,
          responseData: error.response?.data,
        });
        
        // If it's "Cart not found", treat as empty cart (normal case)
        if (errorMessage.includes("Cart not found")) {
          set({
            cart: null,
            error: null,
            isLoading: false,
          });
          return;
        }
        // If it's "User not found", there's an authentication issue
        if (errorMessage.includes("User not found")) {
          const errorMsg = "خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.";
          set({
            cart: null,
            error: errorMsg,
            isLoading: false,
          });
          throw error;
        }
        // If there's no specific message, it might be a route not found (404 from Express)
        if (!errorMessage) {
          console.warn('404 with no error message - likely route not found');
          const errorMsg = "Route not found. Please check the API endpoint.";
          set({
            cart: null,
            error: errorMsg,
            isLoading: false,
          });
          throw error;
        }
      }
      // For other errors, set error message
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
      console.log('Add to cart request:', {
        url: '/carts/add',
        productId,
        quantity,
        size,
        baseURL: axiosInstance.defaults.baseURL,
      });
      
      const response = await axiosInstance.post("/carts/add", { productId, quantity, size });
      set({ cart: response.data && typeof response.data === 'object' ? response.data : null, isUpdating: false });
    } catch (error) {
      console.error('Add to cart error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
      });
      
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
