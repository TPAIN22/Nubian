import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set, get) => ({
  products: [],
  product: null,
  isProductsLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  isTabBarVisible: true,
  categories: [],
  signInModelVisible: false,
  selectedCategory: null,

  setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

  setSignInModelVisible: (visible) => set({ signInModelVisible: visible }),
  setIsTabBarVisible: (visible) => set({ isTabBarVisible: visible }),
  setProduct: (product) => set({ product }),
  setError: (error) => set({ error }),

  // Original getProducts function for category-specific products
  getProducts: async () => {
    const { page, hasMore, isProductsLoading, selectedCategory } = get();

    if (!selectedCategory) {
      set({ error: "Please select a category first." });
      return;
    }
    if (!hasMore || isProductsLoading) return;

    set({ isProductsLoading: true, error: null });

    try {
      const response = await axiosInstance.get("/products", {
        params: { page, limit: 6, category: selectedCategory },
      });

      const newProducts = response.data.products;
      const totalPages = response.data.totalPages;

      set((state) => {
        const nextHasMore = state.page + 1 <= totalPages;
        const products = page === 1 ? newProducts : [...state.products, ...newProducts];
        return {
          products,
          page: state.page + 1,
          hasMore: nextHasMore,
          isProductsLoading: false,
          error: null,
        };
      });
    } catch (error) {
      set({ isProductsLoading: false, error: error?.message || "Failed to load products" });
    }
  },

  // New function to get all products without category filter (for home screen)
  getAllProducts: async () => {
    set({ isProductsLoading: true, error: null });
    
    try {
      const response = await axiosInstance.get("/products", {
        params: { page: 1, limit: 20 }, // Get more products for home screen
      });

      const products = response.data.products || response.data; // Handle different response structures
      
      set({ 
        products, 
        isProductsLoading: false, 
        error: null 
      });
    } catch (error) {
      set({ 
        isProductsLoading: false, 
        error: error?.message || "Failed to load products" 
      });
    }
  },

  selectCategoryAndLoadProducts: async (categoryId) => {
    set({ selectedCategory: categoryId, page: 1, products: [], hasMore: true, error: null });
    await get().getProducts();
  },

  getCategories: async () => {
    set({ isProductsLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/categories");
      set({ categories: response.data, isProductsLoading: false });
    } catch (error) {
      set({ error: error?.message || "Failed to load categories", isProductsLoading: false });
    }
  },

  // Reset products state when needed
  resetProducts: () => set({ products: [], page: 1, hasMore: true, selectedCategory: null }),
}));

export default useItemStore;