import { create } from 'zustand';
import axiosInstance from "@/services/api/client";
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWishlistStore = create((set, get) => {
  // استرجع المفضلة من AsyncStorage عند بدء التطبيق (فقط على العميل)
  const loadWishlistFromStorage = async () => {
    // تحقق من وجود window للتأكد من أننا في بيئة العميل
    if (typeof window !== 'undefined') {
      try {
        const localWishlist = await AsyncStorage.getItem('wishlist');
        if (localWishlist) {
          set({ wishlist: JSON.parse(localWishlist) });
        }
      } catch (error) {
        console.warn('Failed to load wishlist from storage:', error);
      }
    }
  };

  // قم بتحميل البيانات الأولية بعد إنشاء المتجر
  setTimeout(() => {
    loadWishlistFromStorage();
  }, 0);

  return {
    wishlist: [],
    isLoading: false,
    error: null,

    // جلب المفضلة من الباكند
    // Token is automatically added by axios interceptor
    fetchWishlist: async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await axiosInstance.get('/wishlist');
        set({ wishlist: res.data, isLoading: false });
        await AsyncStorage.setItem('wishlist', JSON.stringify(res.data));
      } catch (error) {
        set({ error: error?.response?.data?.message || error.message, isLoading: false });
        // في حال فشل الجلب من السيرفر، جرب جلبها من التخزين المحلي
        const localWishlist = await AsyncStorage.getItem('wishlist');
        if (localWishlist) {
          set({ wishlist: JSON.parse(localWishlist) });
        }
      }
    },

    // إضافة منتج (Optimistic + Feedback)
    // Token is automatically added by axios interceptor
    addToWishlist: async (product) => {
      const prevWishlist = get().wishlist;
      set({ wishlist: [product, ...prevWishlist] });
      try {
        await axiosInstance.post(`/wishlist/${product._id}`, {});
        await get().fetchWishlist();
        Alert.alert('تمت الإضافة', 'تمت إضافة المنتج إلى المفضلة بنجاح');
      } catch (error) {
        set({ wishlist: prevWishlist, error: error?.response?.data?.message || error.message });
        Alert.alert('خطأ', error?.response?.data?.message || error.message);
        console.log(error)
      }
    },

    // حذف منتج (Optimistic + Feedback)
    // Token is automatically added by axios interceptor
    removeFromWishlist: async (productId) => {
      const prevWishlist = get().wishlist;
      set({ wishlist: prevWishlist.filter((p) => p._id !== productId) });
      try {
        await axiosInstance.delete(`/wishlist/${productId}`);
        await get().fetchWishlist();
        Alert.alert('تم الحذف', 'تمت إزالة المنتج من المفضلة');
      } catch (error) {
        set({ wishlist: prevWishlist, error: error?.response?.data?.message || error.message });
        Alert.alert('خطأ', error?.response?.data?.message || error.message);
      }
    },

    // هل المنتج في المفضلة؟
    isInWishlist: (productId) => {
      return get().wishlist.some((p) => p._id === productId);
    },

    // تنظيف الأخطاء
    clearError: () => set({ error: null }),
  };
});

export default useWishlistStore; 