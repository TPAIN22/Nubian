import { create } from "zustand";

/* ================= SAFE TYPES ================= */

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type Order = {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;

  city?: string;
  address?: string;

  productsDetails: {
    name: string;
  }[];

  productsCount?: number;
};

type CreateOrderPayload = {
  addressId?: string;
  items: unknown[];

  paymentMethod: string;

  proofFileUri?: string;
};

/* ================= STORE ================= */

type OrderStore = {
  orders: Order[];
  selectedOrder: Order | null;

  isLoading: boolean;
  error: string | null;

  getUserOrders: () => Promise<void>;
  getOrderById: (id: string) => Promise<void>;
  createOrder: (payload: CreateOrderPayload) => Promise<void>;

  clearOrders: () => void;
};

const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  selectedOrder: null,

  isLoading: false,
  error: null,

  /* ===== MOCK SAFE CALL ===== */
  getUserOrders: async () => {
    set({ isLoading: true });

    try {
      // 👇 حط API هنا
      const data: Order[] = [];

      set({
        orders: data,
        isLoading: false,
      });
    } catch {
      set({
        error: "error",
        isLoading: false,
      });
    }
  },

  getOrderById: async (id) => {
    set({ isLoading: true });

    try {
      const order: Order = {
        _id: id,
        orderNumber: "123",
        status: "pending",
        totalAmount: 0,
        productsDetails: [],
      };

      set({
        selectedOrder: order,
        isLoading: false,
      });
    } catch {
      set({
        error: "error",
        isLoading: false,
      });
    }
  },

  createOrder: async () => {
    set({ isLoading: true });

    try {
      set({ isLoading: false });
    } catch {
      set({
        error: "error",
        isLoading: false,
      });
    }
  },

  clearOrders: () =>
    set({
      orders: [],
      selectedOrder: null,
    }),
}));

export default useOrderStore;