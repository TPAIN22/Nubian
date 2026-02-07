import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useProductCacheStore from '@/store/useProductCacheStore';
import type { NormalizedProduct } from '@/domain/product/product.normalize';

// ============================================
// PERF TIMING INFRASTRUCTURE
// ============================================

interface PerfTiming {
  tapStart: number;
}

const perfTimings: Record<string, PerfTiming> = {};

/** Called from ProductCard on tap */
export const markTapStartTime = (productId: string) => {
  perfTimings[productId] = { tapStart: Date.now() };
};

/** Get elapsed time since tap */
const getElapsedFromTap = (productId: string): number | null => {
  const timing = perfTimings[productId];
  return timing?.tapStart ? Date.now() - timing.tapStart : null;
};

/** Log PERF metric with consistent format */
export const logPerf = (productId: string, metric: string, extra?: string) => {
  if (!__DEV__) return;
  const elapsed = getElapsedFromTap(productId);
  const elapsedStr = elapsed !== null ? ` +${elapsed}ms` : '';
  console.log(`[PERF ${productId}] ${metric}${elapsedStr}${extra ? ` ${extra}` : ''}`);
};

// ============================================
// HOOK INTERFACE
// ============================================

interface UseProductFetchReturn {
  product: NormalizedProduct | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isFromCache: boolean;
}

interface InitialProductData {
  id?: string;
  name?: string;
  images?: string[];
  price?: number;
  finalPrice?: number;
  discountPrice?: number;
}

/**
 * Hook to fetch product with caching, deduplication, and instant render support.
 */
export const useProductFetch = (
  productId: string,
  initialData?: InitialProductData
): UseProductFetchReturn => {
  const getProductCached = useProductCacheStore((state) => state.getProductCached);
  const getCachedProduct = useProductCacheStore((state) => state.getCachedProduct);
  const setInitialProduct = useProductCacheStore((state) => state.setInitialProduct);

  // Check cache synchronously at mount time
  const cachedEntry = productId ? getCachedProduct(productId) : null;
  const isCachedFull = !!(cachedEntry && !cachedEntry.isPartial);

  // Determine source at MOUNT TIME only (not reactive)
  const initialSourceRef = useRef<'cache' | 'initial' | 'none'>('none');
  
  // Create initial product from initialData (memoized)
  const initialProduct = useMemo(() => {
    if (cachedEntry?.data) {
      initialSourceRef.current = 'cache';
      return cachedEntry.data;
    }
    if (initialData?.id) {
      initialSourceRef.current = 'initial';
      return {
        id: initialData.id,
        name: initialData.name || '',
        description: '',
        isActive: true,
        deletedAt: null,
        categoryId: '',
        merchantId: null,
        images: initialData.images || [],
        attributeDefs: [],
        variants: [],
        simple: {
          stock: null,
          merchantPrice: null,
          finalPrice: initialData.finalPrice || initialData.price || null,
          nubianMarkup: null,
          dynamicMarkup: null,
          discountPrice: initialData.discountPrice || null,
        },
        productLevelPricing: {
          merchantPrice: null,
          finalPrice: initialData.finalPrice || initialData.price || null,
          nubianMarkup: null,
          dynamicMarkup: null,
          discountPrice: initialData.discountPrice || null,
        },
      } as NormalizedProduct;
    }
    initialSourceRef.current = 'none';
    return null;
  }, [cachedEntry?.data, initialData?.id, initialData?.name, initialData?.images, initialData?.finalPrice, initialData?.price, initialData?.discountPrice]);

  const [product, setProduct] = useState<NormalizedProduct | null>(initialProduct);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(isCachedFull);

  // Refs for guards - CRITICAL: these must persist across renders
  const hasFetched = useRef(false);
  const hasLoggedFirstContent = useRef(false);
  const isCancelled = useRef(false);

  // Store initial data in cache for future navigations
  useEffect(() => {
    if (initialData?.id && !cachedEntry?.data) {
      setInitialProduct(initialData.id, {
        id: initialData.id,
        name: initialData.name || '',
        images: initialData.images || [],
      } as Partial<NormalizedProduct>);
    }
  }, [initialData?.id, initialData?.name, initialData?.images, cachedEntry?.data, setInitialProduct]);

  // Stable fetch function
  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    isCancelled.current = false;
    setError(null);

    logPerf(productId, 'FETCH_START');

    try {
      const fetchedProduct = await getProductCached(productId);

      if (isCancelled.current) return;

      if (!fetchedProduct) {
        throw new Error('Product not found');
      }

      setProduct(fetchedProduct);
      setIsFromCache(false);
      setIsLoading(false);

      // Log CONTENT_UPDATED (always after fetch completes)
      logPerf(productId, 'CONTENT_UPDATED');
    } catch (err: any) {
      if (isCancelled.current) return;

      const errorMessage = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || "تعذر تحميل المنتج";
      
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [productId, getProductCached]);

  // MOUNT EFFECT: Log FIRST_CONTENT_INITIAL exactly once, then fetch
  useEffect(() => {
    // Reset guards for new productId
    hasLoggedFirstContent.current = false;
    hasFetched.current = false;
    
    // Log FIRST_CONTENT_INITIAL exactly ONCE at mount
    if (initialProduct && !hasLoggedFirstContent.current) {
      hasLoggedFirstContent.current = true;
      const source = initialSourceRef.current;
      logPerf(productId, 'FIRST_CONTENT_INITIAL', `(from ${source})`);
    }

    // StrictMode guard for fetch
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    fetchProduct();

    return () => {
      isCancelled.current = true;
    };
  }, [productId]); // Note: intentionally minimal deps - this is a mount effect

  const refetch = useCallback(async () => {
    hasFetched.current = false;
    await fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch,
    isFromCache,
  };
};
