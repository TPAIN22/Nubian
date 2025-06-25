import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set, get) => ({
  // State
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
  selectedCategory: null,

  // Actions
  setSelectedCategory: (categoryId) => 
    set({ selectedCategory: categoryId }),

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

  // Get products with pagination and category filter
  getProducts: async () => {
    const { page, hasMore, isProductsLoading, selectedCategory } = get();

    if (!selectedCategory) {
      set({ error: "يرجى اختيار قسم أولاً." });
      return;
    }

    if (!hasMore || isProductsLoading) return;

    set({ isProductsLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/products", {
        params: { 
          page, 
          limit: 6, 
          category: selectedCategory 
        },
      });

      const newProducts = Array.isArray(response.data.products) 
        ? response.data.products 
        : [];
      const totalPages = Number(response.data.totalPages) || 1;
      const currentPage = Number(response.data.currentPage) || page;

      set((state) => {
        const nextPage = currentPage + 1;
        const nextHasMore = nextPage <= totalPages;
        const updatedProducts = page === 1 
          ? newProducts 
          : [...state.products, ...newProducts];

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
        || "تعذر تحميل المنتجات";
      
      set({ 
        isProductsLoading: false, 
        error: errorMessage 
      });
    }
  },

  // Get all products without pagination
  getAllProducts: async (limit = 10) => {
    set({ isProductsLoading: true, error: null });
    
    try {
      const response = await axiosInstance.get("/products", {
        params: { page: 1, limit },
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
        // Reset pagination for getAllProducts
        page: 1,
        hasMore: false,
        selectedCategory: null,
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "تعذر تحميل المنتجات";
      
      set({
        isProductsLoading: false,
        error: errorMessage,
      });
    }
  },

  // Get single product by ID
  getProductById: async (productId) => {
    set({ isProductsLoading: true, error: null });
    
    try {
      const response = await axiosInstance.get(`/products/${productId}`);
      set({
        product: response.data,
        isProductsLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "تعذر تحميل المنتج";
      
      set({
        isProductsLoading: false,
        error: errorMessage,
        product: null,
      });
    }
  },

  // Select category and load its products
  selectCategoryAndLoadProducts: async (categoryId) => {
    set({ 
      selectedCategory: categoryId, 
      page: 1, 
      products: [], 
      hasMore: true, 
      error: null 
    });
    
    await get().getProducts();
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
    set({ isCategoriesLoading: true, error: null });
    
    try {
      const response = await axiosInstance.get("/categories");
      const categories = Array.isArray(response.data) 
        ? response.data 
        : [];
        
      set({ 
        categories, 
        isCategoriesLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "فشل في تحميل الأقسام";
      
      set({ 
        error: errorMessage, 
        isCategoriesLoading: false,
        categories: [],
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
      const response = await axiosInstance.get("/products/search", {
        params: { 
          q: searchTerm.trim(), 
          limit 
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
        selectedCategory: null,
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
      selectedCategory: null,
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
      selectedCategory: null,
    }),
}));

export default useItemStore;