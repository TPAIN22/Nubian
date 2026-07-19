import axiosInstance from "@/services/api/client";
import type { ProductDTO } from "@/domain/product/product.types";

export type ExploreProduct = ProductDTO;

export interface ExploreFilters {
  // Price range
  minPrice?: number;
  maxPrice?: number;
  // Category
  category?: string;
  // Store/Brand
  store?: string;
  brand?: string;
  // Attributes
  size?: string;
  color?: string;
  // Filters
  discount?: boolean;
  minRating?: number;
  inStock?: boolean;
  fastDelivery?: boolean;
  verifiedStore?: boolean;
}

export type ExploreSort = 
  | 'recommended'
  | 'best_sellers'
  | 'trending'
  | 'new'
  | 'price_low'
  | 'price_high'
  | 'rating';

export interface ExploreParams extends ExploreFilters {
  sort?: ExploreSort;
  page?: number;
  limit?: number;
  currencyCode?: string;
}

export interface ExploreResponse {
  data: ExploreProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

/**
 * Fetch explore products with filters and sorting
 */
export const getExploreProducts = async (params: ExploreParams = {}): Promise<ExploreResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.store) queryParams.append('store', params.store);
    if (params.brand) queryParams.append('brand', params.brand);
    if (params.size) queryParams.append('size', params.size);
    if (params.color) queryParams.append('color', params.color);
    if (params.discount !== undefined) queryParams.append('discount', params.discount.toString());
    if (params.minRating !== undefined) queryParams.append('minRating', params.minRating.toString());
    if (params.inStock !== undefined) queryParams.append('inStock', params.inStock.toString());
    if (params.fastDelivery !== undefined) queryParams.append('fastDelivery', params.fastDelivery.toString());
    if (params.verifiedStore !== undefined) queryParams.append('verifiedStore', params.verifiedStore.toString());
    
    // Add sorting
    if (params.sort) queryParams.append('sort', params.sort);
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    // Add currency
    if (params.currencyCode) queryParams.append('currencyCode', params.currencyCode);
    
    const response = await axiosInstance.get(`products/explore?${queryParams.toString()}`);

    // Backend uses sendPaginated: { success, data: [...], meta: { pagination } }.
    // The client interceptor unwraps that envelope, so `response.data` is the
    // product array and pagination is hoisted to `response.meta.pagination`.
    // We still tolerate the pre-unwrap shape (`response.data.data` /
    // `response.data.meta`) as a defensive fallback.
    const meta = (response as any).meta ?? response.data?.meta;
    const products = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    if (!products) {
      throw new Error('Invalid response structure');
    }

    const pagination = meta?.pagination || {};

    const total = pagination.total || products.length;
    const page = pagination.page || params.page || 1;
    const limit = pagination.limit || params.limit || 20;
    const totalPages = pagination.totalPages || Math.ceil(total / limit);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error('Error fetching explore products:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load explore products'
    );
  }
};
