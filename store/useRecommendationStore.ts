import { create } from 'zustand';
import type { HomeProduct } from "../api/home.api";
import { HomeRecommendations, ProductRecommendations } from '../api/recommendations.api';
import {
  getHomeRecommendations,
  getProductRecommendations,
  getCartRecommendations,
} from '../api/recommendations.api';
import { useCurrencyStore } from './useCurrencyStore';

interface RecommendationState {
  // Home recommendations
  homeRecommendations: HomeRecommendations | null;
  homeRecommendationsCurrency: string | null;
  homeInFlightCurrency: string | null;
  isHomeRecommendationsLoading: boolean;
  homeRecommendationsError: string | null;

  // Product recommendations (cached by product ID)
  productRecommendations: Record<string, ProductRecommendations>;
  productRecommendationsCurrency: Record<string, string | null>;
  productInFlightCurrency: Record<string, string | null>;
  isProductRecommendationsLoading: Record<string, boolean>;
  productRecommendationsError: Record<string, string | null>;

  // Cart recommendations
  cartRecommendations: HomeProduct[];
  cartRecommendationsCurrency: string | null;
  cartInFlightCurrency: string | null;
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
  homeRecommendationsCurrency: null,
  homeInFlightCurrency: null,
  isHomeRecommendationsLoading: false,
  homeRecommendationsError: null,
  productRecommendations: {},
  productRecommendationsCurrency: {},
  productInFlightCurrency: {},
  isProductRecommendationsLoading: {},
  productRecommendationsError: {},
  cartRecommendations: [],
  cartRecommendationsCurrency: null,
  cartInFlightCurrency: null,
  isCartRecommendationsLoading: false,
  cartRecommendationsError: null,
};

const currentCurrency = (): string | null =>
  useCurrencyStore.getState().currencyCode || null;

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
  ...initialState,

  fetchHomeRecommendations: async () => {
    const reqCurrency = currentCurrency();
    const { isHomeRecommendationsLoading, homeInFlightCurrency } = get();

    // Short-circuit only when the SAME currency is already in flight.
    if (isHomeRecommendationsLoading && homeInFlightCurrency === reqCurrency) return;

    set({
      isHomeRecommendationsLoading: true,
      homeRecommendationsError: null,
      homeInFlightCurrency: reqCurrency,
    });

    try {
      const data = await getHomeRecommendations(reqCurrency || undefined);
      // Drop stale: user switched currency mid-flight.
      if (currentCurrency() !== reqCurrency) return;
      set({
        homeRecommendations: data,
        homeRecommendationsCurrency: reqCurrency,
        isHomeRecommendationsLoading: false,
        homeRecommendationsError: null,
        homeInFlightCurrency: null,
      });
    } catch (error: any) {
      if (currentCurrency() !== reqCurrency) return;
      set({
        isHomeRecommendationsLoading: false,
        homeRecommendationsError: error?.message || 'Failed to load home recommendations',
        homeInFlightCurrency: null,
      });
    }
  },

  fetchProductRecommendations: async (productId: string) => {
    const reqCurrency = currentCurrency();
    const {
      isProductRecommendationsLoading,
      productRecommendations,
      productRecommendationsCurrency,
      productInFlightCurrency,
    } = get();

    // Cache hit only if it was fetched at the current currency.
    if (
      productRecommendations[productId] &&
      productRecommendationsCurrency[productId] === reqCurrency
    ) {
      return;
    }
    // Loading hit only if the in-flight request is for the current currency.
    if (
      isProductRecommendationsLoading[productId] &&
      productInFlightCurrency[productId] === reqCurrency
    ) {
      return;
    }

    set({
      isProductRecommendationsLoading: {
        ...isProductRecommendationsLoading,
        [productId]: true,
      },
      productInFlightCurrency: {
        ...productInFlightCurrency,
        [productId]: reqCurrency,
      },
      productRecommendationsError: {
        ...get().productRecommendationsError,
        [productId]: null,
      },
    });

    try {
      const data = await getProductRecommendations(productId, reqCurrency || undefined);
      if (currentCurrency() !== reqCurrency) return;
      set({
        productRecommendations: {
          ...get().productRecommendations,
          [productId]: data,
        },
        productRecommendationsCurrency: {
          ...get().productRecommendationsCurrency,
          [productId]: reqCurrency,
        },
        isProductRecommendationsLoading: {
          ...get().isProductRecommendationsLoading,
          [productId]: false,
        },
        productInFlightCurrency: {
          ...get().productInFlightCurrency,
          [productId]: null,
        },
        productRecommendationsError: {
          ...get().productRecommendationsError,
          [productId]: null,
        },
      });
    } catch (error: any) {
      if (currentCurrency() !== reqCurrency) return;
      set({
        isProductRecommendationsLoading: {
          ...get().isProductRecommendationsLoading,
          [productId]: false,
        },
        productInFlightCurrency: {
          ...get().productInFlightCurrency,
          [productId]: null,
        },
        productRecommendationsError: {
          ...get().productRecommendationsError,
          [productId]: error?.message || 'Failed to load product recommendations',
        },
      });
    }
  },

  fetchCartRecommendations: async () => {
    const reqCurrency = currentCurrency();
    const { isCartRecommendationsLoading, cartInFlightCurrency } = get();
    if (isCartRecommendationsLoading && cartInFlightCurrency === reqCurrency) return;

    set({
      isCartRecommendationsLoading: true,
      cartRecommendationsError: null,
      cartInFlightCurrency: reqCurrency,
    });

    try {
      const data = await getCartRecommendations(reqCurrency || undefined);
      if (currentCurrency() !== reqCurrency) return;
      set({
        cartRecommendations: data,
        cartRecommendationsCurrency: reqCurrency,
        isCartRecommendationsLoading: false,
        cartRecommendationsError: null,
        cartInFlightCurrency: null,
      });
    } catch (error: any) {
      if (currentCurrency() !== reqCurrency) return;
      set({
        isCartRecommendationsLoading: false,
        cartRecommendationsError: error?.message || 'Failed to load cart recommendations',
        cartInFlightCurrency: null,
      });
    }
  },

  clearProductRecommendations: (productId?: string) => {
    const {
      productRecommendations,
      productRecommendationsCurrency,
      productInFlightCurrency,
      isProductRecommendationsLoading,
      productRecommendationsError,
    } = get();

    if (productId) {
      const dropKey = (m: Record<string, any>) => {
        const next = { ...m };
        delete next[productId];
        return next;
      };
      set({
        productRecommendations: dropKey(productRecommendations),
        productRecommendationsCurrency: dropKey(productRecommendationsCurrency),
        productInFlightCurrency: dropKey(productInFlightCurrency),
        isProductRecommendationsLoading: dropKey(isProductRecommendationsLoading),
        productRecommendationsError: dropKey(productRecommendationsError),
      });
    } else {
      set({
        productRecommendations: {},
        productRecommendationsCurrency: {},
        productInFlightCurrency: {},
        isProductRecommendationsLoading: {},
        productRecommendationsError: {},
      });
    }
  },

  clearHomeRecommendations: () => {
    set({
      homeRecommendations: null,
      homeRecommendationsCurrency: null,
      homeRecommendationsError: null,
    });
  },

  clearCartRecommendations: () => {
    set({
      cartRecommendations: [],
      cartRecommendationsCurrency: null,
      cartRecommendationsError: null,
    });
  },

  reset: () => set(initialState),
}));
