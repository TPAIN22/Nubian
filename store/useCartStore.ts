/**
 * Cart Store (Zustand)
 * Manages cart state with optimized selectors and generic attribute support
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import axiosInstance from "@/services/api/client";
import type {
  Cart,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest,
} from "@/types/cart.types";
import { mergeSizeAndAttributes, normalizeAttributes } from "@/utils/cartUtils";

interface CartStore {
  // State
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  inFlight: Promise<void> | null; // ✅ dedupe

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

function safeParseCartResponse(responseData: any): Cart | null {
  // Backend returns { success: true, data: {...cart...} } OR cart object directly
  const cartData =
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
      ? responseData.data
      : responseData;

  return cartData && typeof cartData === "object" ? (cartData as Cart) : null;
}

/**
 * ✅ Build payload in one place to ensure:
 * - attributes are normalized (lowercase keys, trimmed values)
 * - size always matches attributes.size if present
 * - don't send empty attributes / empty size
 */
function buildCartPayload(
  input: {
    productId: string;
    quantity?: number;
    size?: string;
    attributes?: Record<string, string>;
  },
  mode: "add" | "update" | "remove"
): AddToCartRequest | UpdateCartItemRequest | RemoveFromCartRequest {
  const rawMerged = mergeSizeAndAttributes(input.size ?? "", input.attributes ?? {});
  const mergedAttributes = normalizeAttributes(rawMerged); // ✅ مهم جداً

  // ✅ prefer size from attributes (source of truth)
  const resolvedSize = mergedAttributes.size ?? "";

  // ✅ do not keep duplicate / conflicting size keys
  // (normalizeAttributes already lowercases, but just in case)
  if (resolvedSize) mergedAttributes.size = resolvedSize;

  const base: any = {
    productId: input.productId,
  };

  if (mode !== "remove") {
    base.quantity = input.quantity ?? 1;
  }

  // send size only if present
  if (resolvedSize) base.size = resolvedSize;

  // send attributes only if not empty
  if (Object.keys(mergedAttributes).length > 0) base.attributes = mergedAttributes;

  return base;
}

// Create store with selector middleware for performance
const useCartStore = create<CartStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    cart: null,
    isLoading: false,
    error: null,
    isUpdating: false,
    inFlight: null,

    // Clear error
    clearError: () => set({ error: null }),

    // Clear cart
    clearCart: () => set({ cart: null }),

    // Fetch cart from backend
    fetchCart: async () => {
      const { isLoading, inFlight } = get();
      if (isLoading && inFlight) return inFlight;

      set({ isLoading: true, error: null });

      const task = (async () => {
        try {
          const response = await axiosInstance.get("/carts");
          set({
            cart: safeParseCartResponse(response.data),
            isLoading: false,
          });
        } catch (error: any) {
          // Handle 404 as empty cart
          if (error.response?.status === 404) {
            set({ cart: null, error: null, isLoading: false });
            return;
          }

          const errorMessage =
            error.response?.data?.message ||
            error?.message ||
            "حدث خطأ أثناء جلب السلة.";

          set({ cart: null, error: errorMessage, isLoading: false });
          throw error;
        } finally {
          set({ inFlight: null });
        }
      })();

      set({ inFlight: task });
      return task;
    },

    // Add product to cart
    addToCart: async (
      productId: string,
      quantity: number,
      size: string = "",
      attributes?: Record<string, string>
    ) => {
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });

      try {
        const payload = buildCartPayload(
          { productId, quantity, size, attributes: attributes ?? {} as Record<string, string> },
          "add"
        ) as AddToCartRequest;

        const response = await axiosInstance.post("/carts/add", payload);

        set({
          cart: safeParseCartResponse(response.data),
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء إضافة المنتج للسلة.";

        set({ error: errorMessage, isUpdating: false });
        throw error;
      }
    },

    // Update cart item quantity (delta or absolute depending on backend)
    updateCartItemQuantity: async (
      productId: string,
      quantity: number,
      size: string = "",
      attributes?: Record<string, string>
    ) => {
      if (typeof quantity !== "number" || quantity === 0) {
        set({ error: "قيمة الكمية غير صحيحة." });
        return;
      }
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });

      try {
        const payload = buildCartPayload(
          { productId, quantity, size, attributes: attributes ?? {} },
          "update"
        ) as UpdateCartItemRequest;

        const response = await axiosInstance.put("/carts/update", payload);

        set({
          cart: safeParseCartResponse(response.data),
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء تحديث السلة.";

        set({ error: errorMessage, isUpdating: false });
        throw error;
      }
    },

    // Remove from cart
    removeFromCart: async (
      productId: string,
      size: string = "",
      attributes?: Record<string, string>
    ) => {
      if (get().isUpdating) return;
      set({ isUpdating: true, error: null });

      try {
        const payload = buildCartPayload(
          { productId, size, attributes: attributes ?? {} },
          "remove"
        ) as RemoveFromCartRequest;

        const response = await axiosInstance.delete("/carts/remove", { data: payload });

        set({
          cart: safeParseCartResponse(response.data),
          isUpdating: false,
        });
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error?.message ||
          "حدث خطأ أثناء حذف المنتج من السلة.";

        set({ error: errorMessage, isUpdating: false });
        throw error;
      }
    },
  }))
);

// Optimized selectors
export const useCartItems = () => useCartStore((state) => state.cart?.products || []);
export const useCartTotal = () => useCartStore((state) => state.cart?.totalPrice || 0);
export const useCartQuantity = () => useCartStore((state) => state.cart?.totalQuantity || 0);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartUpdating = () => useCartStore((state) => state.isUpdating);
export const useCartError = () => useCartStore((state) => state.error);
export const useIsCartEmpty = () =>
  useCartStore((state) => {
    const cart = state.cart;
    return !cart?.products || cart.products.length === 0;
  });

export default useCartStore;
