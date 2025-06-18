import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  orderStats: null,
  isLoading: false,
  error: null,

  // جلب طلبات المستخدم
  getUserOrders: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ 
        orders: response.data, 
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load orders";
      set({
        error: errorMessage,
        isLoading: false,
        orders: []
      });
      throw error;
    }
  },

  // جلب طلب واحد بالتفصيل
  getOrderById: async (orderId, token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ 
        selectedOrder: response.data, 
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load order details";
      set({
        error: errorMessage,
        isLoading: false,
        selectedOrder: null
      });
      throw error;
    }
  },

  // إنشاء طلب جديد
  createOrder: async (orderData, token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // إضافة الطلب الجديد لبداية القائمة
      const currentOrders = get().orders;
      set({ 
        orders: [response.data, ...currentOrders],
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create order";
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  // تحديث حالة الطلب (للأدمن)
  updateOrderStatus: async (orderId, statusData, token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/status`, statusData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // تحديث الطلب في القائمة
      const currentOrders = get().orders;
      const updatedOrders = currentOrders.map(order => 
        order._id === orderId ? response.data : order
      );
      
      set({ 
        orders: updatedOrders,
        selectedOrder: response.data,
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update order status";
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  // جلب إحصائيات الطلبات (للأدمن)
  getOrderStats: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/orders/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ 
        orderStats: response.data, 
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load order statistics";
      set({
        error: errorMessage,
        isLoading: false,
        orderStats: null
      });
      throw error;
    }
  },

  // تصفية الطلبات حسب الحالة
  getOrdersByStatus: (status) => {
    const orders = get().orders;
    return orders.filter(order => order.status === status);
  },

  // البحث في الطلبات
  searchOrders: (searchTerm) => {
    const orders = get().orders;
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productsDetails?.some(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  },

  // حساب إجمالي المبلغ للطلبات
  getTotalAmount: (status = null) => {
    const orders = get().orders;
    const filteredOrders = status ? orders.filter(order => order.status === status) : orders;
    return filteredOrders.reduce((total, order) => total + order.totalAmount, 0);
  },

  // حساب عدد المنتجات في الطلب
  getTotalProductsCount: (orderId) => {
    const orders = get().orders;
    const order = orders.find(order => order._id === orderId);
    return order?.productsCount || 0;
  },

  // تنظيف البيانات
  clearOrders: () => set({ orders: [], selectedOrder: null, error: null }),
  clearError: () => set({ error: null }),
  clearSelectedOrder: () => set({ selectedOrder: null }),

  // إعادة تحميل الطلبات
  refreshOrders: async (token) => {
    return get().getUserOrders(token);
  },
}));

export default useOrderStore;