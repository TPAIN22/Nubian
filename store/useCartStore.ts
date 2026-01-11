/**
 * Cart Store (Zustand)
 * Manages cart state with optimized selectors and generic attribute support
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import axiosInstance from "@/utils/axiosInstans";
import type { Cart, AddToCartRequest, UpdateCartItemRequest, RemoveFromCartRequest } from "@/types/cart.types";
import { mergeSizeAndAttributes, extractCartItemAttributes } from "@/utils/cartUtils";

interface CartStore {
  // State
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;

  // Actions
  clearError: () => void;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity: number,
    size?: string,
    attributes?: Record<string, string>
  ) => Promise<void>;
  updateCartItemQuantity: (
    productId: string,
    quantity: number,
    size?: string,
    attributes?: Record<string, string>
  ) => Promise<void>;
  removeFromCart: (
    productId: string,
    size?: string,
    attributes?: Record<string, string>
  ) => Promise<void>;
}

// Create store with selector middleware for performance
const useCartStore = create<CartStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    cart: null,
    isLoading: false,
    error: null,
    isUpdating: false,

    // Clear error
    clearError: () => set({ error: null }),

    // Clear cart
    clearCart: () => set({ cart: null }),

    // Fetch cart from backend
    fetchCart: async () => {
      if (get().isLoading) return;
      set({ isLoading: true, error: null });
      try {
        const response = await axiosInstance.get("/carts");
        // Backend returns { success: true, data: {...cart...} }
        const responseData = response.data as { success?: boolean; data?: Cart } | Cart;
        const cartData = (responseData && typeof responseData === 'object' && 'data' in responseData) 
          ? responseData.data 
          : (responseData as Cart);
        set({
          cart: cartData && typeof cartData === 'object' ? (cartData as Cart) : null,
          isLoading: false,
        });
      } catch (error: any) {
        // Handle 404 (cart not found) as empty cart, not an error
        if (error.response?.status === 404) {
          const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || '';
          const errorCode = error.response?.data?.error?.code || '';

          // Treat any 404 as empty cart (normal case for new users or when cart doesn't exist)
          // This handles: "Cart not found", "Resource not found", or any other 404
          // Only exception is if it's explicitly a user/auth issue
          if (errorMessage.includes("User not found") || errorCode === 'UNAUTHORIZED') {
            const errorMsg = "خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.";
            set({
              cart: null,
              error: errorMsg,
              isLoading: false,
            });
            throw error;
          }
          
          // For all other 404s (including "Resource not found", "Cart not found"), treat as empty cart
          set({
            cart: null,
            error: null,
            isLoading: false,
          });
          return;
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

    // Add product to cart
    addToCart: async (productId: string, quantity: number, size: string = '', attributes?: Record<string, string>) => {
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });
      try {
        // Merge size and attributes for backward compatibility
        const mergedAttributes = mergeSizeAndAttributes(size, attributes);

        const payload: AddToCartRequest = {
          productId,
          quantity,
          ...(size ? { size } : {}),
          ...(Object.keys(mergedAttributes).length > 0 ? { attributes: mergedAttributes } : {}),
        };

        const response = await axiosInstance.post("/carts/add", payload);
        // Backend returns { success: true, data: {...cart...} }
        const responseData = response.data as { success?: boolean; data?: Cart } | Cart;
        const cartData = (responseData && typeof responseData === 'object' && 'data' in responseData) 
          ? responseData.data 
          : (responseData as Cart);
        set({
          cart: cartData && typeof cartData === 'object' ? (cartData as Cart) : null,
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء إضافة المنتج للسلة.";
        set({
          error: errorMessage,
          isUpdating: false,
        });
        throw error;
      }
    },

    // Update cart item quantity
    updateCartItemQuantity: async (
      productId: string,
      quantity: number,
      size: string = '',
      attributes?: Record<string, string>
    ) => {
      if (typeof quantity !== 'number' || quantity === 0) {
        set({ error: "قيمة الكمية غير صحيحة." });
        return;
      }
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });

      try {
        // Merge size and attributes for backward compatibility
        const mergedAttributes = mergeSizeAndAttributes(size, attributes);

        const payload: UpdateCartItemRequest = {
          productId,
          quantity,
          ...(size ? { size } : {}),
          ...(Object.keys(mergedAttributes).length > 0 ? { attributes: mergedAttributes } : {}),
        };

        const response = await axiosInstance.put("/carts/update", payload);
        // Backend returns { success: true, data: {...cart...} }
        const responseData = response.data as { success?: boolean; data?: Cart } | Cart;
        const cartData = (responseData && typeof responseData === 'object' && 'data' in responseData) 
          ? responseData.data 
          : (responseData as Cart);
        set({
          cart: cartData && typeof cartData === 'object' ? (cartData as Cart) : null,
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء تحديث السلة.";
        set({
          error: errorMessage,
          isUpdating: false,
        });
        throw error;
      }
    },

    // Remove from cart
    removeFromCart: async (productId: string, size: string = '', attributes?: Record<string, string>) => {
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });

      try {
        // Merge size and attributes for backward compatibility
        const mergedAttributes = mergeSizeAndAttributes(size, attributes);

        const payload: RemoveFromCartRequest = {
          productId,
          ...(size ? { size } : {}),
          ...(Object.keys(mergedAttributes).length > 0 ? { attributes: mergedAttributes } : {}),
        };

        const response = await axiosInstance.delete("/carts/remove", { data: payload });
        // Backend returns { success: true, data: {...cart...} }
        const responseData = response.data as { success?: boolean; data?: Cart } | Cart;
        const cartData = (responseData && typeof responseData === 'object' && 'data' in responseData) 
          ? responseData.data 
          : (responseData as Cart);
        set({
          cart: cartData && typeof cartData === 'object' ? (cartData as Cart) : null,
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error?.message || "حدث خطأ أثناء حذف المنتج من السلة.";
        set({
          error: errorMessage,
          isUpdating: false,
        });
        throw error;
      }
    },
  }))
);

// Optimized selectors to prevent unnecessary re-renders
export const useCartItems = () => useCartStore((state) => state.cart?.products || []);
export const useCartTotal = () => useCartStore((state) => state.cart?.totalPrice || 0);
export const useCartQuantity = () => useCartStore((state) => state.cart?.totalQuantity || 0);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartUpdating = () => useCartStore((state) => state.isUpdating);
export const useCartError = () => useCartStore((state) => state.error);
export const useIsCartEmpty = () => useCartStore((state) => {
  const cart = state.cart;
  return !cart?.products || cart.products.length === 0;
});

export default useCartStore;
