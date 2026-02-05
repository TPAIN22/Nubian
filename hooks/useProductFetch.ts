import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from "@/services/api/client";
import type { ProductDTO } from "@/domain/product/product.types";
import { normalizeProduct, type NormalizedProduct } from "@/domain/product/product.normalize";
import { markFetchStart, markFetchEnd, markContentReady } from "@/utils/performance";

interface UseProductFetchReturn {
  product: NormalizedProduct | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProductFetch = (productId: string): UseProductFetchReturn => {
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMarkedContent = useRef(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    // PERFORMANCE: Mark fetch start
    if (__DEV__) markFetchStart(productId);

    try {
      const response = await axiosInstance.get(`/products/${productId}`);
      
      // PERFORMANCE: Mark fetch end
      if (__DEV__) markFetchEnd(productId);
      
      // Backend returns: { success: true, data: { ...product... }, message: "..." }
      // Extract the actual product data from response.data.data
      const productData = (response.data?.data || response.data) as ProductDTO;
      
      if (!productData || !productData._id) {
        throw new Error('Invalid product data received');
      }
      
      const normalizedProduct = normalizeProduct(productData);
      setProduct(normalizedProduct);
      
      // PERFORMANCE: Mark content ready (first meaningful paint)
      if (__DEV__ && !hasMarkedContent.current) {
        hasMarkedContent.current = true;
        // Use requestAnimationFrame to mark after React commits the update
        requestAnimationFrame(() => {
          markContentReady(productId);
        });
      }
    } catch (err: any) {
      // PERFORMANCE: Mark fetch end even on error
      if (__DEV__) markFetchEnd(productId);
      
      const errorMessage = err?.response?.data?.error?.message 
        || err?.response?.data?.message 
        || err?.message 
        || "تعذر تحميل المنتج";
      setError(errorMessage);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    hasMarkedContent.current = false;
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
};
