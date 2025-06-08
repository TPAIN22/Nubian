import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

export const useOrderStore = create((set, get) => ({
    order: null,
    isLoading: false,
    error: null,
    
    getOrder: () => get().order,
    
    createOrder: async (token , deliveryAddress) => {
        try {
            set({ isLoading: true, error: null });
            const response = await axiosInstance.post("/orders", { 
                paymentMethod: "cash",
                deliveryAddress
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            set({ order: response.data });
            
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "حدث خطأ أثناء إنشاء الطلب";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },
    
    // دالة للحصول على items الأوردر
    getOrderItems: () => {
        const order = get().order;
        if (order?.items && Array.isArray(order.items)) {
            return order.items;
        }
        if (Array.isArray(order)) {
            return order;
        }
        return [];
    },
    
    // دالة للحصول على إجمالي السعر
    getOrderTotal: () => {
        const order = get().order;
        if (order?.totalAmount) {
            return order.totalAmount;
        }
        // حساب السعر من الـ items
        const items = get().getOrderItems();
        return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    },

    updateOrder: async (orderId, updateData, token) => {
        try {
            const response = await axiosInstance.put(`/orders/${orderId}`, updateData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            set({ order: response.data });
            return response.data;
        } catch (error) {
            set({ error: error.response?.data?.message || "حدث خطأ أثناء تحديث الطلب" });
            throw error;
        }
    },

    deleteOrder: async (orderId, token) => {
        try {
            await axiosInstance.delete(`/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            set({ order: null });
        } catch (error) {
            set({ error: error.response?.data?.message || "حدث خطأ أثناء حذف الطلب" });
            throw error;
        }
    },
}));