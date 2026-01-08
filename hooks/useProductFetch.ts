import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@/utils/axiosInstans';
import type { Product } from '@/types/cart.types';

interface UseProductFetchReturn {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProductFetch = (productId: string): UseProductFetchReturn => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/products/${productId}`);
      
      // Backend returns: { success: true, data: { ...product... }, message: "..." }
      // Extract the actual product data from response.data.data
      const productData = response.data?.data || response.data;
      
      if (!productData || !productData._id) {
        throw new Error('Invalid product data received');
      }
      
      setProduct(productData);
    } catch (err: any) {
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
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
};
