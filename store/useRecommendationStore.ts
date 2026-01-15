import { create } from 'zustand';
import type { HomeProduct } from "../api/home.api";
import { HomeRecommendations, ProductRecommendations } from '../api/recommendations.api';
import {
  getHomeRecommendations,
  getProductRecommendations,
  getCartRecommendations,
} from '../api/recommendations.api';

interface RecommendationState {
  // Home recommendations
  homeRecommendations: HomeRecommendations | null;
  isHomeRecommendationsLoading: boolean;
  homeRecommendationsError: string | null;

  // Product recommendations (cached by product ID)
  productRecommendations: Record<string, ProductRecommendations>;
  isProductRecommendationsLoading: Record<string, boolean>;
  productRecommendationsError: Record<string, string | null>;

  // Cart recommendations
  cartRecommendations: HomeProduct[];
  isCartRecommendationsLoading: boolean;
  cartRecommendationsError: string | null;

  // Actions
  fetchHomeRecommendations: () => Promise<void>;
  fetchProductRecommendations: (productId: string) => Promise<void>;
  fetchCartRecommendations: () => Promise<void>;
  clearProductRecommendations: (productId?: string) => void;
  clearHomeRecommendations: () => void;
  clearCartRecommendations: () => void;
  reset: () => void;
}

const initialState = {
  homeRecommendations: null,
  isHomeRecommendationsLoading: false,
  homeRecommendationsError: null,
  productRecommendations: {},
  isProductRecommendationsLoading: {},
  productRecommendationsError: {},
  cartRecommendations: [],
  isCartRecommendationsLoading: false,
  cartRecommendationsError: null,
};

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  ...initialState,

  fetchHomeRecommendations: async () => {
    const { isHomeRecommendationsLoading } = get();
    if (isHomeRecommendationsLoading) return; // Prevent duplicate calls

    set({ isHomeRecommendationsLoading: true, homeRecommendationsError: null });

    try {
      const data = await getHomeRecommendations();
      set({
        homeRecommendations: data,
        isHomeRecommendationsLoading: false,
        homeRecommendationsError: null,
      });
    } catch (error: any) {
      set({
        isHomeRecommendationsLoading: false,
        homeRecommendationsError: error?.message || 'Failed to load home recommendations',
      });
    }
  },

  fetchProductRecommendations: async (productId: string) => {
    const { isProductRecommendationsLoading, productRecommendations } = get();
    
    // Skip if already loading or cached
    if (isProductRecommendationsLoading[productId] || productRecommendations[productId]) {
      return;
    }

    set({
      isProductRecommendationsLoading: {
        ...isProductRecommendationsLoading,
        [productId]: true,
      },
      productRecommendationsError: {
        ...get().productRecommendationsError,
        [productId]: null,
      },
    });

    try {
      const data = await getProductRecommendations(productId);
      set({
        productRecommendations: {
          ...productRecommendations,
          [productId]: data,
        },
        isProductRecommendationsLoading: {
          ...isProductRecommendationsLoading,
          [productId]: false,
        },
        productRecommendationsError: {
          ...get().productRecommendationsError,
          [productId]: null,
        },
      });
    } catch (error: any) {
      set({
        isProductRecommendationsLoading: {
          ...isProductRecommendationsLoading,
          [productId]: false,
        },
        productRecommendationsError: {
          ...get().productRecommendationsError,
          [productId]: error?.message || 'Failed to load product recommendations',
        },
      });
    }
  },

  fetchCartRecommendations: async () => {
    const { isCartRecommendationsLoading } = get();
    if (isCartRecommendationsLoading) return;

    set({ isCartRecommendationsLoading: true, cartRecommendationsError: null });

    try {
      const data = await getCartRecommendations();
      set({
        cartRecommendations: data,
        isCartRecommendationsLoading: false,
        cartRecommendationsError: null,
      });
    } catch (error: any) {
      set({
        isCartRecommendationsLoading: false,
        cartRecommendationsError: error?.message || 'Failed to load cart recommendations',
      });
    }
  },

  clearProductRecommendations: (productId?: string) => {
    const { productRecommendations, isProductRecommendationsLoading, productRecommendationsError } = get();
    
    if (productId) {
      // Clear specific product
      const newRecommendations = { ...productRecommendations };
      delete newRecommendations[productId];
      
      const newLoading = { ...isProductRecommendationsLoading };
      delete newLoading[productId];
      
      const newError = { ...productRecommendationsError };
      delete newError[productId];
      
      set({
        productRecommendations: newRecommendations,
        isProductRecommendationsLoading: newLoading,
        productRecommendationsError: newError,
      });
    } else {
      // Clear all
      set({
        productRecommendations: {},
        isProductRecommendationsLoading: {},
        productRecommendationsError: {},
      });
    }
  },

  clearHomeRecommendations: () => {
    set({
      homeRecommendations: null,
      homeRecommendationsError: null,
    });
  },

  clearCartRecommendations: () => {
    set({
      cartRecommendations: [],
      cartRecommendationsError: null,
    });
  },

  reset: () => set(initialState),
}));
