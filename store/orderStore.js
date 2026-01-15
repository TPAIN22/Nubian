import { create } from "zustand";
import axiosInstance from "@/services/api/client";
import { quoteCheckout, createOrder as createOrderApi, uploadPaymentProof, fetchOrders as fetchOrdersApi, fetchOrderById } from "@/services/api/checkout.api";

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
      const response = await fetchOrdersApi();
      set({
        orders: response,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "تعذر تحميل الطلبات";
      set({
        error: errorMessage,
        isLoading: false,
        orders: [],
      });
      throw error;
    }
  },

  // جلب طلب واحد بالتفصيل
  // Token is automatically added by axios interceptor
  getOrderById: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchOrderById(orderId);
      set({
        selectedOrder: response,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to load order details";
      set({
        error: errorMessage,
        isLoading: false,
        selectedOrder: null,
      });
      throw error;
    }
  },

  // إنشاء طلب جديد
  // Token is automatically added by axios interceptor
  createOrder: async ({ addressId, items, paymentMethod, transferProof, proofFileUri }) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Create order with transferProof URL if available
      const response = await createOrderApi({ 
        addressId, 
        items, 
        paymentMethod,
        transferProof: transferProof || (proofFileUri?.startsWith('http') ? proofFileUri : null)
      });
      
      let createdOrder = response;
      
      // 2. Fallback: if we only have a local URI and no URL yet, upload it now
      if (paymentMethod === "BANKAK" && proofFileUri && !proofFileUri.startsWith('http') && createdOrder?._id) {
        createdOrder = await uploadPaymentProof(createdOrder._id, { uri: proofFileUri });
      }
      
      const currentOrders = get().orders;
      set({
        orders: [createdOrder, ...currentOrders],
        isLoading: false,
        error: null,
      });
      return createdOrder;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create order";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // تحديث حالة الطلب (للأدمن)
  // Token is automatically added by axios interceptor
  updateOrderStatus: async (orderId, statusData) => {
    set({ isLoading: true, error: null });
    try {
      let endpoint = null;
      if (statusData?.action === "verify") endpoint = `/orders/${orderId}/verify-transfer`;
      if (statusData?.action === "reject") endpoint = `/orders/${orderId}/reject-transfer`;
      if (!endpoint) throw new Error("Invalid action");
      const response = await axiosInstance.post(endpoint, {});
      const currentOrders = get().orders;
      const updatedOrders = currentOrders.map(order =>
        order._id === orderId ? response.data : order
      );

      set({
        orders: updatedOrders,
        selectedOrder: response.data,
        isLoading: false,
        error: null,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update order status";
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  // جلب إحصائيات الطلبات (للأدمن)
  // Token is automatically added by axios interceptor
  getOrderStats: async () => {
    set({ isLoading: false, error: "Not supported in new checkout" });
    return null;
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