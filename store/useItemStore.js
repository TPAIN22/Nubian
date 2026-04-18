import { create } from "zustand";
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { useCallback } from 'react';
import axiosInstance from "@/services/api/client";
import { useCurrencyStore } from './useCurrencyStore';

const useItemStore = create(subscribeWithSelector((set, get) => ({
  // State
  products: [],
  product: null,
  isProductsLoading: false,
  isLoadMoreLoading: false,
  isCategoriesLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  isTabBarVisible: true,
  categories: [],
  signInModelVisible: false,
  // Request tracking to prevent duplicate calls
  _requestInProgress: {
    categories: false,
    products: false,
  },
  // Timestamps for request throttling
  _lastRequestTime: {
    categories: 0,
    products: 0,
  },

  // Actions

  setSignInModelVisible: (visible) => 
    set({ signInModelVisible: visible }),

  setIsTabBarVisible: (visible) => 
    set({ isTabBarVisible: visible }),

  setProduct: (product) => 
    set({ product }),

  setError: (error) => 
    set({ error }),

  clearError: () => 
    set({ error: null }),

  // Get all products with pagination
  getAllProducts: async (limit = 90) => {
    const { _requestInProgress, _lastRequestTime } = get();
    const now = Date.now();
    const MIN_INTERVAL = 5000; // 5 seconds minimum between product requests
    
    // Prevent duplicate requests
    if (_requestInProgress.products) {
      return;
    }
    
    // Throttle: Don't fetch if last fetch was less than MIN_INTERVAL ago
    if (now - _lastRequestTime.products < MIN_INTERVAL && _lastRequestTime.products > 0) {
      return;
    }
    
    set({ 
      isProductsLoading: true, 
      error: null,
      _requestInProgress: { ..._requestInProgress, products: true },
      _lastRequestTime: { ..._lastRequestTime, products: now }
    });
    
    try {
      // First try with pagination params (like the mobile app expects)
      // Also try to get only active products if API supports it
      // Get currency code from currency store
      const currencyCode = useCurrencyStore.getState().currencyCode;
      
      let response;
      try {
        response = await axiosInstance.get("/products", {
          params: { page: 1, limit, isActive: true, currencyCode: currencyCode || undefined },
        });
      } catch (paginationError) {
        // If pagination with isActive fails, try without isActive
        try {
          response = await axiosInstance.get("/products", {
            params: { page: 1, limit },
          });
        } catch (paginationError2) {
          // If pagination fails completely, try without params (like dashboard does)
          response = await axiosInstance.get("/products");
        }
      }


      // Try multiple response structure patterns
      let products = [];
      
      // Pattern 1: response.data.products (most common)
      if (Array.isArray(response.data?.products)) {
        products = response.data.products;
      }
      // Pattern 2: response.data is directly an array
      else if (Array.isArray(response.data)) {
        products = response.data;
      }
      // Pattern 3: response.data.data.products (nested structure)
      else if (Array.isArray(response.data?.data?.products)) {
        products = response.data.data.products;
      }
      // Pattern 4: response.data.data is directly an array
      else if (Array.isArray(response.data?.data)) {
        products = response.data.data;
      }
      // Pattern 5: response.data.results (some APIs use 'results')
      else if (Array.isArray(response.data?.results)) {
        products = response.data.results;
      }
      // Pattern 6: response.data.items (some APIs use 'items')
      else if (Array.isArray(response.data?.items)) {
        products = response.data.items;
      }

      // Filter out inactive products if they have isActive field (like banners)
      // Only filter if API didn't already filter by isActive query param
      const originalLength = products.length;
      if (products.length > 0) {
        // Only filter if we have products with isActive field defined
        // Don't filter if all products are missing isActive (they might be active by default)
        const hasIsActiveField = products.some(p => p.hasOwnProperty('isActive'));
        if (hasIsActiveField) {
          products = products.filter((product) => product.isActive !== false);
        }
      }

      const totalPages = Number(response.data?.totalPages) || Number(response.data?.data?.totalPages) || 1;
      const currentPage = Number(response.data?.currentPage) || Number(response.data?.data?.currentPage) || Number(response.data?.page) || 1;

      const { _requestInProgress } = get();
      set({
        products,
        isProductsLoading: false,
        error: products.length === 0 ? "لا توجد منتجات متاحة" : null,
        // Set up pagination for getAllProducts
        page: currentPage + 1,
        hasMore: currentPage < totalPages,
        _requestInProgress: { ..._requestInProgress, products: false }
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "تعذر تحميل المنتجات";
      
      const { _requestInProgress } = get();
      set({
        isProductsLoading: false,
        error: errorMessage,
        products: [], // Ensure products is reset on error
        _requestInProgress: { ..._requestInProgress, products: false }
      });
    }
  },

  getProductById: async (productId) => {
    set({ isProductsLoading: true, error: null });
    
    try {
      // Get currency code from currency store
      const currencyCode = useCurrencyStore.getState().currencyCode;
      
      const response = await axiosInstance.get(`/products/${productId}`, {
        params: { currencyCode: currencyCode || undefined },
      });
      
      // Backend returns: { success: true, data: { ...product... }, message: "..." }
      // Extract the actual product data from response.data.data
      const productData = response.data?.data || response.data;
      
      if (!productData || !productData._id) {
        throw new Error('Invalid product data received');
      }
      
      set({
        product: productData,
        isProductsLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || error?.message 
        || "تعذر تحميل المنتج";
      
      set({
        isProductsLoading: false,
        error: errorMessage,
        product: null,
      });
    }
  },

  // Load more products for current category
  loadMoreProducts: async () => {
    const { hasMore, isProductsLoading } = get();
    
    if (hasMore && !isProductsLoading) {
      await get().getProducts();
    }
  },

  // Get categories
  getCategories: async () => {
    const { _requestInProgress, _lastRequestTime, categories } = get();
    const now = Date.now();
    const MIN_INTERVAL = 10000; // 10 seconds minimum between category requests
    
    // Prevent duplicate requests
    if (_requestInProgress.categories) {
      return;
    }
    
    // Throttle: Don't fetch if last fetch was less than MIN_INTERVAL ago
    if (now - _lastRequestTime.categories < MIN_INTERVAL && _lastRequestTime.categories > 0) {
      // Return existing categories if available
      if (categories && categories.length > 0) {
        return;
      }
    }
    
    set({ 
      isCategoriesLoading: true, 
      error: null,
      _requestInProgress: { ..._requestInProgress, categories: true },
      _lastRequestTime: { ..._lastRequestTime, categories: now }
    });
    
    try {
      const response = await axiosInstance.get("/categories");

      // Try multiple response structure patterns
      // Backend sends: res.json(categories) - so response.data is directly an array
      let categories = [];
      
      // Pattern 1: response.data is directly an array (BACKEND FORMAT - nubian-auth)
      if (Array.isArray(response.data)) {
        categories = response.data;
      }
      // Pattern 2: response.data.categories (wrapped format)
      else if (Array.isArray(response.data?.categories)) {
        categories = response.data.categories;
      }
      // Pattern 3: response.data.data.categories (nested structure)
      else if (Array.isArray(response.data?.data?.categories)) {
        categories = response.data.data.categories;
      }
      // Pattern 4: response.data.data is directly an array
      else if (Array.isArray(response.data?.data)) {
        categories = response.data.data;
      }
      // Pattern 5: response.data.results (some APIs use 'results')
      else if (Array.isArray(response.data?.results)) {
        categories = response.data.results;
      }
      // Pattern 6: response.data.items (some APIs use 'items')
      else if (Array.isArray(response.data?.items)) {
        categories = response.data.items;
      }

      // Filter out inactive categories if they have isActive field
      const originalLength = categories.length;
      if (categories.length > 0) {
        const hasIsActiveField = categories.some(c => c.hasOwnProperty('isActive'));
        if (hasIsActiveField) {
          categories = categories.filter((category) => category.isActive !== false);
        }
      }

      const { _requestInProgress } = get();
      set({ 
        categories, 
        isCategoriesLoading: false,
        error: null,
        _requestInProgress: { ..._requestInProgress, categories: false }
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "فشل في تحميل الأقسام";
      
      const { _requestInProgress } = get();
      set({ 
        error: errorMessage, 
        isCategoriesLoading: false,
        categories: [],
        _requestInProgress: { ..._requestInProgress, categories: false }
      });
    }
  },

  // Search products
  searchProducts: async (searchTerm, limit = 10) => {
    if (!searchTerm || searchTerm.trim() === '') {
      set({ error: "يرجى إدخال كلمة للبحث" });
      return;
    }

    set({ isProductsLoading: true, error: null });
    
    try {
      const currencyCode = useCurrencyStore.getState().currencyCode;
      const response = await axiosInstance.get("/products/search", {
        params: { 
          q: searchTerm.trim(), 
          limit,
          currencyCode: currencyCode || undefined
        },
      });

      const products = Array.isArray(response.data.products) 
        ? response.data.products 
        : Array.isArray(response.data) 
        ? response.data 
        : [];

      set({
        products,
        isProductsLoading: false,
        error: null,
        // Reset pagination for search results
        page: 1,
        hasMore: false,
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "تعذر البحث عن المنتجات";
      
      set({
        isProductsLoading: false,
        error: errorMessage,
      });
    }
  },

  // Reset all products state
  resetProducts: () => 
    set({ 
      products: [], 
      page: 1, 
      hasMore: true, 
      error: null,
    }),

  // Reset single product state
  resetProduct: () => 
    set({ product: null }),

  // Reset entire store
  resetStore: () => 
    set({
      products: [],
      product: null,
      isProductsLoading: false,
      isCategoriesLoading: false,
      error: null,
      page: 1,
      hasMore: true,
      isTabBarVisible: true,
      categories: [],
      signInModelVisible: false,
    }),

  // Load more products for getAllProducts
  loadMoreAllProducts: async () => {
    const { hasMore, isProductsLoading, page } = get();
    
    if (hasMore && !isProductsLoading) {
      set({ isProductsLoading: true, error: null });
      
      try {
        const currencyCode = useCurrencyStore.getState().currencyCode;
        const response = await axiosInstance.get("/products", {
          params: { page, limit: 8, currencyCode: currencyCode || undefined },
        });

        const newProducts = Array.isArray(response.data.products) 
          ? response.data.products 
          : [];

        const totalPages = Number(response.data.totalPages) || 1;
        const currentPage = Number(response.data.currentPage) || page;

        set((state) => {
          const nextPage = currentPage + 1;
          const nextHasMore = nextPage <= totalPages;
          const updatedProducts = [...state.products, ...newProducts];

          return {
            products: updatedProducts,
            page: nextPage,
            hasMore: nextHasMore,
            isProductsLoading: false,
            error: null,
          };
        });
      } catch (error) {
        const errorMessage = error?.response?.data?.message 
          || error?.message 
          || "تعذر تحميل المزيد من المنتجات";
        
        set({
          isProductsLoading: false,
          error: errorMessage,
        });
      }
    }
  },
})));

// ============================================================================
// OPTIMIZED SELECTORS - Use these in components to prevent unnecessary re-renders
// ============================================================================

/**
 * Hook to get setProduct action - stable reference, never causes re-renders
 */
export const useSetProduct = () => {
  return useItemStore((state) => state.setProduct);
};

/**
 * Hook to get current product
 */
export const useCurrentProduct = () => {
  return useItemStore((state) => state.product);
};

/**
 * Hook to get products list
 */
export const useProductsList = () => {
  return useItemStore((state) => state.products);
};

/**
 * Hook to get loading states
 */
export const useItemLoadingStates = () => {
  return useItemStore(
    useShallow((state) => ({
      isProductsLoading: state.isProductsLoading,
      isCategoriesLoading: state.isCategoriesLoading,
      isLoadMoreLoading: state.isLoadMoreLoading,
    }))
  );
};

/**
 * Hook to get categories
 */
export const useCategories = () => {
  return useItemStore((state) => state.categories);
};

/**
 * Hook to get tab bar visibility
 */
export const useTabBarVisibility = () => {
  return useItemStore((state) => state.isTabBarVisible);
};

/**
 * Hook to get sign-in modal visibility and setter
 */
export const useSignInModal = () => {
  return useItemStore(
    useShallow((state) => ({
      signInModelVisible: state.signInModelVisible,
      setSignInModelVisible: state.setSignInModelVisible,
    }))
  );
};

/**
 * Hook to get all item store actions - stable references
 */
export const useItemStoreActions = () => {
  return useItemStore(
    useShallow((state) => ({
      setProduct: state.setProduct,
      setIsTabBarVisible: state.setIsTabBarVisible,
      getAllProducts: state.getAllProducts,
      getProductById: state.getProductById,
      getCategories: state.getCategories,
      searchProducts: state.searchProducts,
      resetProducts: state.resetProducts,
      resetProduct: state.resetProduct,
      loadMoreProducts: state.loadMoreProducts,
      loadMoreAllProducts: state.loadMoreAllProducts,
    }))
  );
};

export default useItemStore;