import axiosInstance from '@/utils/axiosInstans';

export interface ExploreProduct {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  images?: string[];
  averageRating?: number;
  category?: {
    _id: string;
    name: string;
  };
  merchant?: {
    _id: string;
    businessName: string;
    status: string;
  };
  // Ranking scores
  exploreScore?: number;
  rankingScore?: number;
  visibilityScore?: number;
  userAffinityScore?: number;
  trendingBoost?: number;
  discountBoost?: number;
  // Filterable attributes
  sizes?: string[];
  colors?: string[];
  variants?: Array<{
    _id: string;
    attributes: Record<string, string>;
    price: number;
    discountPrice?: number;
    stock: number;
  }>;
}

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
    
    const response = await axiosInstance.get(`/products/explore?${queryParams.toString()}`);
    
    // Backend uses sendPaginated which returns: { success: true, data: [...], meta: { pagination: {...} } }
    const responseData = response.data;
    
    if (!responseData) {
      throw new Error('Invalid response structure');
    }

    // Handle paginated response structure
    const products = Array.isArray(responseData.data) ? responseData.data : [];
    const pagination = responseData.meta?.pagination || {};
    
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
      message: responseData.message,
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
