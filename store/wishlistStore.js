import { create } from 'zustand';
import axiosInstance from '@/utils/axiosInstans';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWishlistStore = create((set, get) => {
  // استرجع المفضلة من AsyncStorage عند بدء التطبيق
  const loadWishlistFromStorage = async () => {
    const localWishlist = await AsyncStorage.getItem('wishlist');
    if (localWishlist) {
      set({ wishlist: JSON.parse(localWishlist) });
    }
  };
  loadWishlistFromStorage();

  return {
    wishlist: [],
    isLoading: false,
    error: null,

    // جلب المفضلة من الباكند
    fetchWishlist: async (token) => {
      set({ isLoading: true, error: null });
      try {
        const res = await axiosInstance.get('/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    addToWishlist: async (product, token) => {
      const prevWishlist = get().wishlist;
      set({ wishlist: [product, ...prevWishlist] });
      try {
        await axiosInstance.post(`/wishlist/${product._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await get().fetchWishlist(token);
        Alert.alert('تمت الإضافة', 'تمت إضافة المنتج إلى المفضلة بنجاح');
      } catch (error) {
        set({ wishlist: prevWishlist, error: error?.response?.data?.message || error.message });
        Alert.alert('خطأ', error?.response?.data?.message || error.message);
        console.log(error)
      }
    },

    // حذف منتج (Optimistic + Feedback)
    removeFromWishlist: async (productId, token) => {
      const prevWishlist = get().wishlist;
      set({ wishlist: prevWishlist.filter((p) => p._id !== productId) });
      try {
        await axiosInstance.delete(`/wishlist/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await get().fetchWishlist(token);
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