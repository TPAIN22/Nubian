import { create } from "zustand";
import axiosInstance from "@/utils/axiosInstans";

const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  orderStats: null,
  isLoading: false,
  error: null,

  // جلب طلبات المستخدم
  // Token is automatically added by axios interceptor
  getUserOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/orders/my-orders");
      if (!Array.isArray(response.data)) {
        throw new Error("البيانات المستلمة غير صحيحة");
      }
      set({ 
        orders: response.data, 
        isLoading: false,
        error: null 
      });
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
      }
      const errorMessage = error?.response?.data?.message || error?.message || "تعذر تحميل الطلبات";
      set({
        error: errorMessage,
        isLoading: false,
        orders: []
      });
      throw error;
    }
  },

  // جلب طلب واحد بالتفصيل
  // Token is automatically added by axios interceptor
  getOrderById: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
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
  // Token is automatically added by axios interceptor
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/orders", orderData);
      
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
  // Token is automatically added by axios interceptor
  updateOrderStatus: async (orderId, statusData) => {
    set({ isLoading: true, error: null });
    try {
      // Backend expects PATCH /orders/:id/status
      const response = await axiosInstance.patch(`/orders/${orderId}/status`, statusData);
      
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
  // Token is automatically added by axios interceptor
  getOrderStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/orders/stats");
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
  refreshOrders: async () => {
    return get().getUserOrders();
  },
}));

export default useOrderStore;