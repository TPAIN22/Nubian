import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set, get) => ({
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

  // Get all products with pagination
  getAllProducts: async (limit = 90) => {
    set({ isProductsLoading: true, error: null });
    
    try {
      // First try with pagination params (like the mobile app expects)
      // Also try to get only active products if API supports it
      let response;
      try {
        response = await axiosInstance.get("/products", {
          params: { page: 1, limit, isActive: true },
        });
      } catch (paginationError) {
        // If pagination with isActive fails, try without isActive
        try {
          response = await axiosInstance.get("/products", {
            params: { page: 1, limit },
          });
        } catch (paginationError2) {
          // If pagination fails completely, try without params (like dashboard does)
          console.log("⚠️ Pagination params failed, trying without params...");
          response = await axiosInstance.get("/products");
        }
      }

      // Debug: Log the response structure
      console.log("📦 Products API Response:", {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        hasProducts: !!response.data?.products,
        productsType: Array.isArray(response.data?.products) ? 'array' : typeof response.data?.products,
        productsLength: Array.isArray(response.data?.products) ? response.data.products.length : 'N/A',
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        fullResponse: response.data
      });

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
          if (originalLength !== products.length) {
            console.log(`📦 Filtered out ${originalLength - products.length} inactive products`);
          }
        } else {
          console.log("📦 Products don't have isActive field, showing all products");
        }
      }

      console.log("📦 Parsed products:", products.length, "items");

      const totalPages = Number(response.data?.totalPages) || Number(response.data?.data?.totalPages) || 1;
      const currentPage = Number(response.data?.currentPage) || Number(response.data?.data?.currentPage) || Number(response.data?.page) || 1;

      set({
        products,
        isProductsLoading: false,
        error: products.length === 0 ? "لا توجد منتجات متاحة" : null,
        // Set up pagination for getAllProducts
        page: currentPage + 1,
        hasMore: currentPage < totalPages,
        selectedCategory: null,
      });
    } catch (error) {
      console.error("❌ Error fetching products:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url,
        fullError: error
      });
      
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || "تعذر تحميل المنتجات";
      
      set({
        isProductsLoading: false,
        error: errorMessage,
        products: [], // Ensure products is reset on error
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

  // Load more products for getAllProducts
  loadMoreAllProducts: async () => {
    const { hasMore, isProductsLoading, page } = get();
    
    if (hasMore && !isProductsLoading) {
      set({ isProductsLoading: true, error: null });
      
      try {
        const response = await axiosInstance.get("/products", {
          params: { page, limit: 8 },
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
}));

export default useItemStore;