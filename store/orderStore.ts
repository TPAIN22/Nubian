import { create } from "zustand";
import axiosInstance from "@/services/api/client";
import { describeError } from "@/utils/apiError";

/* ================= TYPES ================= */

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "PLACED"
  | "PAID"
  | "REJECTED";

export type Order = {
  _id: string;
  id?: string;
  orderNumber?: string;
  status: OrderStatus;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  shippingFee?: number;
  currency?: string;

  city?: string;
  address?: any;

  items?: {
    productId: string;
    name?: string;
    price?: number;
    quantity: number;
    image?: string;
    attributes?: Record<string, string>;
  }[];

  productsDetails?: { name: string }[];
  productsCount?: number;

  paymentMethod?: string;
  paymentStatus?: string;
  proofUrl?: string;

  createdAt?: string;
  estimatedDeliveryAt?: string;
};

export type CreateOrderPayload = {
  addressId?: string;
  shippingAddress?: string;
  phoneNumber?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    attributes?: Record<string, string>;
    [k: string]: unknown;
  }[];
  paymentMethod: "CASH" | "BANKAK" | string;
  couponCode?: string;
  transferProof?: string;
  paymentProofUrl?: string;
  proofFileUri?: string;
  idempotencyKey?: string;
};

const extractServerMessage = (e: any): string => describeError(e);

/* ================= STORE ================= */

type OrderStore = {
  orders: Order[];
  selectedOrder: Order | null;

  isLoading: boolean;
  error: string | null;

  getUserOrders: () => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  createOrder: (payload: CreateOrderPayload) => Promise<Order>;

  clearError: () => void;
  clearOrders: () => void;
};

const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  selectedOrder: null,

  isLoading: false,
  error: null,

  getUserOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/orders/my-orders");
      const orders: Order[] = Array.isArray(data) ? data : data?.orders ?? [];
      set({ orders, isLoading: false });
    } catch (e: any) {
      set({ error: extractServerMessage(e), isLoading: false });
    }
  },

  getOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get(`/orders/${id}`);
      const order: Order = data?.order ?? data;
      set({ selectedOrder: order, isLoading: false });
      return order;
    } catch (e: any) {
      set({ error: extractServerMessage(e), isLoading: false });
      return null;
    }
  },

  createOrder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const headers: Record<string, string> = {};
      if (payload.idempotencyKey) {
        headers["Idempotency-Key"] = payload.idempotencyKey;
      }
      const { idempotencyKey: _omit, ...body } = payload;
      const { data } = await axiosInstance.post("/orders", body, { headers });
      const order: Order = data?.order ?? data;
      set((state) => ({
        orders: order?._id ? [order, ...state.orders] : state.orders,
        selectedOrder: order ?? state.selectedOrder,
        isLoading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: extractServerMessage(e), isLoading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),

  clearOrders: () =>
    set({
      orders: [],
      selectedOrder: null,
      error: null,
    }),
}));

export default useOrderStore;
