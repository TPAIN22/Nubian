import { create } from 'zustand';
import axiosInstance from "@/services/api/client";
import { getCategoryById, getProductsByCategory, CategoryDetails } from '@/api/category.api';
import type { ProductDTO } from "@/domain/product/product.types";
import { useCurrencyStore } from './useCurrencyStore';

interface CategoryStoreState {
  // Global categories list state
  categories: any[];
  loading: boolean;
  error: string | null;
  
  // Specific category navigation state
  selectedCategory: CategoryDetails | null;
  categoryProducts: ProductDTO[];
  hasMoreProducts: boolean;
  productsPage: number;
  productsLoading: boolean;
  productsLoadingMore: boolean;
  productsError: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (id: string) => Promise<void>;
  fetchProductsByCategory: (id: string, page?: number) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  clearCategoryState: () => void;
}

const useCategoryStore = create<CategoryStoreState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  selectedCategory: null,
  categoryProducts: [],
  hasMoreProducts: true,
  productsPage: 1,
  productsLoading: false,
  productsLoadingMore: false,
  productsError: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get('/categories');
      
      let rawCategories = [];
      if (Array.isArray(response.data)) {
        rawCategories = response.data;
      } else if (Array.isArray(response.data?.data)) {
        rawCategories = response.data.data;
      } else if (Array.isArray(response.data?.categories)) {
        rawCategories = response.data.categories;
      }

      const categoryMap: Record<string, any> = {};
      const topLevelCategories: any[] = [];

      rawCategories.forEach((category: any) => {
        categoryMap[category._id] = { ...category, children: [] };
      });

      rawCategories.forEach((category: any) => {
        if (category.parent) {
          const parentId = typeof category.parent === 'object' ? category.parent._id : category.parent;
          if (categoryMap[parentId]) {
            categoryMap[parentId].children.push(categoryMap[category._id]);
          } else {
            topLevelCategories.push(categoryMap[category._id]);
          }
        } else {
          topLevelCategories.push(categoryMap[category._id]);
        }
      });
      
      set({ categories: topLevelCategories, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to load categories", loading: false });
    }
  },

  fetchCategoryById: async (id: string) => {
    set({ productsLoading: true, productsError: null });
    try {
      const category = await getCategoryById(id);
      set({ selectedCategory: category, productsError: null, productsLoading: false });
    } catch (error: any) {
      set({ productsError: error.message || "Failed to load category.", productsLoading: false });
    }
  },

  fetchProductsByCategory: async (id: string, page = 1) => {
    const isFirstPage = page === 1;
    
    if (isFirstPage) {
      set({ productsLoading: true, productsError: null, productsPage: 1, categoryProducts: [], hasMoreProducts: true });
    } else {
      set({ productsLoadingMore: true, productsError: null });
    }

    try {
      const currencyCode = useCurrencyStore.getState().currencyCode;
      const result = await getProductsByCategory(id, page, 20, currencyCode || undefined);
      
      const newProducts = result.data;
      const totalPages = result.totalPages;
      
      set((state) => ({
        categoryProducts: isFirstPage ? newProducts : [...state.categoryProducts, ...newProducts],
        hasMoreProducts: page < totalPages,
        productsPage: page,
        productsLoading: false,
        productsLoadingMore: false,
      }));
    } catch (error: any) {
      set({ 
        productsError: error.message || "Failed to load products.", 
        productsLoading: false,
        productsLoadingMore: false 
      });
    }
  },

  loadMoreProducts: async () => {
    const state = get();
    if (!state.hasMoreProducts || state.productsLoading || state.productsLoadingMore || !state.selectedCategory) {
      return;
    }
    
    await state.fetchProductsByCategory(state.selectedCategory._id, state.productsPage + 1);
  },

  clearCategoryState: () => {
    set({
      selectedCategory: null,
      categoryProducts: [],
      hasMoreProducts: true,
      productsPage: 1,
      productsLoading: false,
      productsLoadingMore: false,
      productsError: null,
    });
  }
}));

export default useCategoryStore;
