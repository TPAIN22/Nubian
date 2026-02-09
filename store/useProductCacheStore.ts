/**
 * Product Cache Store
 * 
 * Provides caching with TTL, request deduplication, and prefetching for products.
 * Used for instant rendering on ProductDetails screen.
 */

import { create } from 'zustand';
import axiosInstance from '@/services/api/client';
import { normalizeProduct, type NormalizedProduct } from '@/domain/product/product.normalize';
import type { ProductDTO } from '@/domain/product/product.types';

// Cache TTL: 60 seconds
const CACHE_TTL = 60_000;

interface CacheEntry {
  data: NormalizedProduct;
  fetchedAt: number;
  isPartial: boolean; // true if from list data, false if full fetch
}

interface ProductCacheState {
  // Product cache by ID
  byId: Record<string, CacheEntry>;
  
  // In-flight requests for deduplication
  inFlight: Record<string, Promise<NormalizedProduct | null>>;
  
  // Actions
  getProductCached: (productId: string) => Promise<NormalizedProduct | null>;
  prefetchProduct: (productId: string) => void;
  setInitialProduct: (productId: string, listData: Partial<NormalizedProduct>) => void;
  getCachedProduct: (productId: string) => CacheEntry | null;
  invalidateProduct: (productId: string) => void;
  clearCache: () => void;
}

const useProductCacheStore = create<ProductCacheState>((set, get) => ({
  byId: {},
  inFlight: {},

  /**
   * Get product from cache if fresh, otherwise fetch.
   * Deduplicates concurrent requests for the same product.
   */
  getProductCached: async (productId: string): Promise<NormalizedProduct | null> => {
    const { byId, inFlight } = get();
    const now = Date.now();

    // Check cache first
    const cached = byId[productId];
    if (cached && !cached.isPartial && (now - cached.fetchedAt) < CACHE_TTL) {
      if (__DEV__) {
        console.log(`[PERF ${productId}] CACHE HIT (age: ${now - cached.fetchedAt}ms)`);
      }
      return cached.data;
    }

    // Check if request is already in flight
    if (inFlight[productId]) {
      const dedupeStart = Date.now();
      const result = await inFlight[productId];
      const waitTime = Date.now() - dedupeStart;
      // Only log dedupe if wait was significant (>50ms)
      if (__DEV__ && waitTime > 50) {
        console.log(`[PERF ${productId}] DEDUPE_WAIT (waited ${waitTime}ms for in-flight request)`);
      }
      return result;
    }

    // Start new fetch
    const fetchPromise = (async (): Promise<NormalizedProduct | null> => {
      const fetchStart = Date.now();

      try {
        const { useCurrencyStore } = require("@/store/useCurrencyStore");
        const { currencyCode } = useCurrencyStore.getState();
        
        const response = await axiosInstance.get(`products/${productId}`, {
          params: { currencyCode: currencyCode || undefined },
        });
        const productData = (response.data?.data || response.data) as ProductDTO;

        if (!productData || !productData._id) {
          throw new Error('Invalid product data received');
        }

        const normalizedProduct = normalizeProduct(productData);

        if (__DEV__) {
          console.log(`[PERF ${productId}] FETCH END +${Date.now() - fetchStart}ms`);
        }

        // Update cache
        set((state) => ({
          byId: {
            ...state.byId,
            [productId]: {
              data: normalizedProduct,
              fetchedAt: Date.now(),
              isPartial: false,
            },
          },
          inFlight: Object.fromEntries(
            Object.entries(state.inFlight).filter(([key]) => key !== productId)
          ),
        }));

        return normalizedProduct;
      } catch (error) {
        if (__DEV__) {
          console.error(`[PERF ${productId}] FETCH ERROR:`, error);
        }

        // Remove from in-flight
        set((state) => ({
          inFlight: Object.fromEntries(
            Object.entries(state.inFlight).filter(([key]) => key !== productId)
          ),
        }));

        return null;
      }
    })();

    // Store in-flight promise for deduplication
    set((state) => ({
      inFlight: {
        ...state.inFlight,
        [productId]: fetchPromise,
      },
    }));

    return fetchPromise;
  },

  /**
   * Fire-and-forget prefetch to prime the cache.
   * Called on press-in to start fetch during press animation.
   */
  prefetchProduct: (productId: string) => {
    const { byId, inFlight } = get();
    const now = Date.now();

    // Skip if already cached (not partial) and fresh
    const cached = byId[productId];
    if (cached && !cached.isPartial && (now - cached.fetchedAt) < CACHE_TTL) {
      return;
    }

    // Skip if already in flight
    if (inFlight[productId]) {
      return;
    }

    if (__DEV__) {
      console.log(`[PERF ${productId}] PREFETCH START`);
    }

    // Fire and forget - don't await
    get().getProductCached(productId);
  },

  /**
   * Store list item data for instant rendering.
   * Called when navigating with initial product data.
   */
  setInitialProduct: (productId: string, listData: Partial<NormalizedProduct>) => {
    const { byId } = get();

    // Don't overwrite full data with partial
    const existing = byId[productId];
    if (existing && !existing.isPartial) {
      return;
    }

    set((state) => ({
      byId: {
        ...state.byId,
        [productId]: {
          data: listData as NormalizedProduct,
          fetchedAt: Date.now(),
          isPartial: true,
        },
      },
    }));
  },

  /**
   * Get cached product synchronously (for initial render check).
   */
  getCachedProduct: (productId: string): CacheEntry | null => {
    return get().byId[productId] || null;
  },

  /**
   * Invalidate a specific product in cache.
   */
  invalidateProduct: (productId: string) => {
    set((state) => {
      const { [productId]: _, ...rest } = state.byId;
      return { byId: rest };
    });
  },

  /**
   * Clear entire cache.
   */
  clearCache: () => {
    set({ byId: {}, inFlight: {} });
  },
}));

// Export hooks for specific use cases
export const usePrefetchProduct = () => useProductCacheStore((state) => state.prefetchProduct);
export const useGetProductCached = () => useProductCacheStore((state) => state.getProductCached);
export const useSetInitialProduct = () => useProductCacheStore((state) => state.setInitialProduct);
export const useGetCachedProduct = () => useProductCacheStore((state) => state.getCachedProduct);

export default useProductCacheStore;
