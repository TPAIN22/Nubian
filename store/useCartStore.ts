/**
 * Cart Store (Zustand)
 * Manages cart state with per-item in-flight tracking and optimistic updates.
 */

import { create } from "zustand";
import { subscribeWithSelector, persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "@/services/api/client";
import type {
  Cart,
  CartItem as CartLineItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveFromCartRequest,
} from "@/types/cart.types";
import {
  generateCartItemKey,
  mergeSizeAndAttributes,
  normalizeAttributes,
} from "@/utils/cartUtils";
import i18n from "@/utils/i18n";

interface CartStore {
  // State
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  /** Set of in-flight item keys (productId|attrs). */
  updatingKeys: Record<string, true>;
  /** True while *any* item mutation is in flight (derived convenience). */
  isUpdating: boolean;
  /** True while a coupon apply/remove call is in flight. */
  isCouponPending: boolean;
  inFlight: Promise<void> | null;

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

  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;

  /** Helper for components: is a given line currently mutating? */
  isItemUpdating: (productId: string, attributes?: Record<string, string>) => boolean;
}

function safeParseCartResponse(responseData: any): Cart | null {
  const cartData =
    responseData && typeof responseData === "object" && "data" in responseData
      ? responseData.data
      : responseData;

  return cartData && typeof cartData === "object" ? (cartData as Cart) : null;
}

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
  const mergedAttributes = normalizeAttributes(rawMerged);

  const resolvedSize = mergedAttributes.size ?? "";
  if (resolvedSize) mergedAttributes.size = resolvedSize;

  const base: any = { productId: input.productId };

  if (mode !== "remove") {
    base.quantity = input.quantity ?? 1;
  }
  if (resolvedSize) base.size = resolvedSize;
  if (Object.keys(mergedAttributes).length > 0) base.attributes = mergedAttributes;

  return base;
}

function t(key: string, fallback: string): string {
  const v = i18n.t(key);
  return v && v !== key ? v : fallback;
}

function pickServerError(error: any, fallbackKey: string, fallbackText: string): string {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    t(fallbackKey, fallbackText)
  );
}

function withUpdatingKey(state: CartStore, key: string, on: boolean): Partial<CartStore> {
  const next = { ...state.updatingKeys };
  if (on) next[key] = true;
  else delete next[key];
  return { updatingKeys: next, isUpdating: Object.keys(next).length > 0 };
}

/** Apply a quantity delta locally; returns null if the line vanished. */
function optimisticDelta(cart: Cart | null, key: string, delta: number): Cart | null {
  if (!cart || !Array.isArray(cart.products)) return cart;

  let totalQtyDelta = 0;
  let totalPriceDelta = 0;
  const products: CartLineItem[] = [];
  let touched = false;

  for (const line of cart.products) {
    const lineKey = generateCartItemKey(
      line?.product?._id as string,
      (line?.attributes as Record<string, string>) ?? undefined
    );
    if (lineKey !== key) {
      products.push(line);
      continue;
    }
    touched = true;
    const nextQty = (line.quantity ?? 0) + delta;
    if (nextQty <= 0) {
      totalQtyDelta -= line.quantity ?? 0;
      // We can't reliably compute price delta without unit price;
      // server reconciliation will fix totalPrice on response.
      continue;
    }
    products.push({ ...line, quantity: nextQty });
    totalQtyDelta += delta;
  }

  if (!touched) return cart;

  return {
    ...cart,
    products,
    totalQuantity: Math.max(0, (cart.totalQuantity ?? 0) + totalQtyDelta),
    totalPrice: Math.max(0, (cart.totalPrice ?? 0) + totalPriceDelta),
  };
}

function optimisticRemove(cart: Cart | null, key: string): Cart | null {
  if (!cart || !Array.isArray(cart.products)) return cart;
  const products = cart.products.filter((line) => {
    const lineKey = generateCartItemKey(
      line?.product?._id as string,
      (line?.attributes as Record<string, string>) ?? undefined
    );
    return lineKey !== key;
  });
  if (products.length === cart.products.length) return cart;
  const removed = cart.products.find((line) => {
    const lineKey = generateCartItemKey(
      line?.product?._id as string,
      (line?.attributes as Record<string, string>) ?? undefined
    );
    return lineKey === key;
  });
  return {
    ...cart,
    products,
    totalQuantity: Math.max(0, (cart.totalQuantity ?? 0) - (removed?.quantity ?? 0)),
  };
}

const useCartStore = create<CartStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        cart: null,
        isLoading: false,
        error: null,
        updatingKeys: {},
        isUpdating: false,
        isCouponPending: false,
        inFlight: null,

        clearError: () => set({ error: null }),
        clearCart: () => set({ cart: null }),

        isItemUpdating: (productId, attributes) => {
          if (!productId) return false;
          const key = generateCartItemKey(productId, attributes);
          return !!get().updatingKeys[key];
        },

        fetchCart: async () => {
          const { isLoading, inFlight } = get();
          if (isLoading && inFlight) return inFlight;

          set({ isLoading: true, error: null });

          const task = (async () => {
            try {
              const response = await axiosInstance.get("/carts");
              const parsed = safeParseCartResponse(response.data);
              set({ cart: parsed, isLoading: false });
            } catch (error: any) {
              if (error?.response?.status === 404) {
                set({ cart: null, error: null, isLoading: false });
                return;
              }
              const errorMessage = pickServerError(
                error,
                "cart_fetchError",
                "Failed to load cart."
              );
              set({ cart: null, error: errorMessage, isLoading: false });
              throw error;
            } finally {
              set({ inFlight: null });
            }
          })();

          set({ inFlight: task });
          return task;
        },

        addToCart: async (productId, quantity, size = "", attributes) => {
          const key = generateCartItemKey(productId, attributes);
          if (get().updatingKeys[key]) return;

          set((s) => ({ ...withUpdatingKey(s, key, true), error: null }));

          try {
            const payload = buildCartPayload(
              { productId, quantity, size, attributes: attributes ?? {} },
              "add"
            ) as AddToCartRequest;

            const response = await axiosInstance.post("/carts/add", payload);
            const parsed = safeParseCartResponse(response.data);

            set((s) => ({ ...withUpdatingKey(s, key, false), cart: parsed }));
          } catch (error: any) {
            const errorMessage = pickServerError(
              error,
              "cart_addError",
              "Failed to add product to cart."
            );
            set((s) => ({ ...withUpdatingKey(s, key, false), error: errorMessage }));
            throw error;
          }
        },

        updateCartItemQuantity: async (productId, quantity, size = "", attributes) => {
          // `quantity` is a delta (see UpdateCartItemRequest). A delta of 0 is a no-op.
          if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
            set({ error: t("cart_invalidQuantity", "Invalid quantity.") });
            return;
          }
          if (quantity === 0) return;

          const key = generateCartItemKey(productId, attributes);
          if (get().updatingKeys[key]) return;

          const prevCart = get().cart;
          const optimisticCart = optimisticDelta(prevCart, key, quantity);

          set((s) => ({
            ...withUpdatingKey(s, key, true),
            error: null,
            cart: optimisticCart,
          }));

          try {
            const payload = buildCartPayload(
              { productId, quantity, size, attributes: attributes ?? {} },
              "update"
            ) as UpdateCartItemRequest;

            const response = await axiosInstance.put("/carts/update", payload);
            const parsed = safeParseCartResponse(response.data);

            set((s) => ({ ...withUpdatingKey(s, key, false), cart: parsed }));
          } catch (error: any) {
            const status = error?.response?.status;
            const code = error?.response?.data?.error?.code;
            const serverMsg =
              error?.response?.data?.error?.message ||
              error?.response?.data?.message ||
              "";
            const isStaleItem =
              status === 404 &&
              (code === "CART_ITEM_NOT_FOUND" ||
                /not found in the cart/i.test(serverMsg));

            const errorMessage = pickServerError(
              error,
              "cart_updateError",
              "Failed to update cart."
            );
            set((s) => ({
              ...withUpdatingKey(s, key, false),
              error: errorMessage,
              cart: prevCart, // rollback
            }));

            // Server has no row for this productId+attributes — local cart is
            // stale. Resync so the user doesn't keep tapping into the same 404.
            if (isStaleItem) {
              get().fetchCart().catch(() => {});
            }
            throw error;
          }
        },

        removeFromCart: async (productId, size = "", attributes) => {
          const key = generateCartItemKey(productId, attributes);
          if (get().updatingKeys[key]) return;

          const prevCart = get().cart;
          const optimisticCart = optimisticRemove(prevCart, key);

          set((s) => ({
            ...withUpdatingKey(s, key, true),
            error: null,
            cart: optimisticCart,
          }));

          try {
            const payload = buildCartPayload(
              { productId, size, attributes: attributes ?? {} },
              "remove"
            ) as RemoveFromCartRequest;

            const response = await axiosInstance.delete("/carts/remove", { data: payload });
            const parsed = safeParseCartResponse(response.data);

            set((s) => ({ ...withUpdatingKey(s, key, false), cart: parsed }));
          } catch (error: any) {
            const errorMessage = pickServerError(
              error,
              "cart_removeError",
              "Failed to remove product from cart."
            );
            set((s) => ({
              ...withUpdatingKey(s, key, false),
              error: errorMessage,
              cart: prevCart,
            }));
            throw error;
          }
        },

        applyCoupon: async (code) => {
          const trimmed = (code || "").trim();
          if (!trimmed) {
            set({ error: t("cart_couponRequired", "Coupon code is required.") });
            return;
          }
          if (get().isCouponPending) return;

          set({ isCouponPending: true, error: null });
          try {
            const response = await axiosInstance.post("/carts/coupon", { code: trimmed });
            const parsed = safeParseCartResponse(response.data);
            set({ cart: parsed, isCouponPending: false });
          } catch (error: any) {
            const errorMessage = pickServerError(
              error,
              "cart_couponError",
              "Failed to apply coupon."
            );
            set({ error: errorMessage, isCouponPending: false });
            throw error;
          }
        },

        removeCoupon: async () => {
          if (get().isCouponPending) return;
          set({ isCouponPending: true, error: null });
          try {
            const response = await axiosInstance.delete("/carts/coupon");
            const parsed = safeParseCartResponse(response.data);
            set({ cart: parsed, isCouponPending: false });
          } catch (error: any) {
            const errorMessage = pickServerError(
              error,
              "cart_couponRemoveError",
              "Failed to remove coupon."
            );
            set({ error: errorMessage, isCouponPending: false });
            throw error;
          }
        },
      }),
      {
        name: "nubian-cart-v1",
        storage: createJSONStorage(() => AsyncStorage),
        // Persist only cart data, never transient flags.
        partialize: (state) => ({ cart: state.cart }),
      }
    )
  )
);

// Optimized selectors
export const useCartItems = () => useCartStore((state) => state.cart?.products || []);
export const useCartTotal = () => useCartStore((state) => state.cart?.totalPrice || 0);
export const useCartCurrency = () => useCartStore((state) => state.cart?.currencyCode);
export const useCartQuantity = () => useCartStore((state) => state.cart?.totalQuantity || 0);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartUpdating = () => useCartStore((state) => state.isUpdating);
export const useCartCouponPending = () => useCartStore((state) => state.isCouponPending);
export const useCartAppliedCoupon = () => useCartStore((state) => state.cart?.appliedCoupon ?? null);
export const useCartSubtotal = () => useCartStore((state) => state.cart?.subtotal ?? 0);
export const useCartDiscount = () => useCartStore((state) => state.cart?.discount ?? 0);
export const useCartShipping = () => useCartStore((state) => state.cart?.shipping ?? 0);
export const useCartError = () => useCartStore((state) => state.error);
export const useIsCartEmpty = () =>
  useCartStore((state) => {
    const cart = state.cart;
    return !cart?.products || cart.products.length === 0;
  });

export default useCartStore;
