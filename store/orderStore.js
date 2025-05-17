import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

export const useOrderStore = create((set, get) => ({
    order: null,
    isLoading: false,
    error: null,
    setOrder: (order) => set({ order }),
    getOrder: () => get().order,
    createOrder: async (token) => {
        try {
            set({ isLoading: true });
            const response = await axiosInstance.post("/orders", { paymentMethod: "cash" ,deliveryAddress: "test"}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            set({ order: response.data });
        } catch (error) {
            set({ error: error.response?.data?.message || "حدث خطأ أثناء إنشاء الطلب" });
        } finally {
            set({ isLoading: false });
        }
    },

    updateOrder: async (order) => {
        const response = await axiosInstance.put(`/orders/${order.id}`, order);
        set({ order: response.data });
    },

    deleteOrder: async (order) => {
        const response = await axiosInstance.delete(`/orders/${order.id}`);
        set({ order: null });
    },


}));
