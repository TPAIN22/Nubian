import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useMemo } from 'react';
import axiosInstance from "@/services/api/client";
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useWishlistStore = create(
  subscribeWithSelector((set, get) => {
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
      // Derived state: Set of wishlist IDs for O(1) lookup
      _wishlistIds: new Set(),

      // جلب المفضلة من الباكند
      // Token is automatically added by axios interceptor
      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get('/wishlist');
          const wishlist = res.data || [];
          const _wishlistIds = new Set(wishlist.map((p) => p._id));
          set({ wishlist, _wishlistIds, isLoading: false });
          await AsyncStorage.setItem('wishlist', JSON.stringify(wishlist));
        } catch (error) {
          set({ error: error?.response?.data?.message || error.message, isLoading: false });
          // في حال فشل الجلب من السيرفر، جرب جلبها من التخزين المحلي
          const localWishlist = await AsyncStorage.getItem('wishlist');
          if (localWishlist) {
            const wishlist = JSON.parse(localWishlist);
            const _wishlistIds = new Set(wishlist.map((p) => p._id));
            set({ wishlist, _wishlistIds });
          }
        }
      },

      // إضافة منتج (Optimistic + Feedback)
      // Token is automatically added by axios interceptor
      addToWishlist: async (product) => {
        const prevWishlist = get().wishlist;
        const prevIds = get()._wishlistIds;
        const newIds = new Set(prevIds);
        newIds.add(product._id);
        set({ wishlist: [product, ...prevWishlist], _wishlistIds: newIds });
        try {
          await axiosInstance.post(`/wishlist/${product._id}`, {});
          await get().fetchWishlist();
          Alert.alert('تمت الإضافة', 'تمت إضافة المنتج إلى المفضلة بنجاح');
        } catch (error) {
          set({ wishlist: prevWishlist, _wishlistIds: prevIds, error: error?.response?.data?.message || error.message });
          Alert.alert('خطأ', error?.response?.data?.message || error.message);
          console.log(error)
        }
      },

      // حذف منتج (Optimistic + Feedback)
      // Token is automatically added by axios interceptor
      removeFromWishlist: async (productId) => {
        const prevWishlist = get().wishlist;
        const prevIds = get()._wishlistIds;
        const newIds = new Set(prevIds);
        newIds.delete(productId);
        set({ wishlist: prevWishlist.filter((p) => p._id !== productId), _wishlistIds: newIds });
        try {
          await axiosInstance.delete(`/wishlist/${productId}`);
          await get().fetchWishlist();
          Alert.alert('تم الحذف', 'تمت إزالة المنتج من المفضلة');
        } catch (error) {
          set({ wishlist: prevWishlist, _wishlistIds: prevIds, error: error?.response?.data?.message || error.message });
          Alert.alert('خطأ', error?.response?.data?.message || error.message);
        }
      },

      // هل المنتج في المفضلة؟ (O(1) lookup via Set)
      isInWishlist: (productId) => {
        return get()._wishlistIds.has(productId);
      },

      // تنظيف الأخطاء
      clearError: () => set({ error: null }),
    };
  })
);

// ============================================================================
// OPTIMIZED SELECTORS - Use these in components to prevent unnecessary re-renders
// ============================================================================

/**
 * Hook to check if a specific product is in wishlist
 * Only re-renders when THIS product's wishlist status changes
 */
export const useIsInWishlist = (productId) => {
  return useWishlistStore(
    useCallback(
      (state) => state._wishlistIds.has(productId),
      [productId]
    )
  );
};

/**
 * Hook to get wishlist actions (add/remove) - stable reference, never causes re-renders
 */
export const useWishlistActions = () => {
  return useWishlistStore(
    useShallow((state) => ({
      addToWishlist: state.addToWishlist,
      removeFromWishlist: state.removeFromWishlist,
      fetchWishlist: state.fetchWishlist,
    }))
  );
};

/**
 * Hook to get wishlist items - only re-renders when wishlist changes
 */
export const useWishlistItems = () => {
  return useWishlistStore((state) => state.wishlist);
};

/**
 * Hook to get wishlist count - only re-renders when count changes
 */
export const useWishlistCount = () => {
  return useWishlistStore((state) => state.wishlist.length);
};

/**
 * Hook to get loading state
 */
export const useWishlistLoading = () => {
  return useWishlistStore((state) => state.isLoading);
};

/**
 * Hook to get error state
 */
export const useWishlistError = () => {
  return useWishlistStore((state) => state.error);
};

export default useWishlistStore; 