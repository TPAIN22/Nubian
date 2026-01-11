import axiosInstance from '@/utils/axiosInstans';
import { HomeProduct } from './home.api';

export interface ProductRecommendations {
  similarItems: HomeProduct[];
  frequentlyBoughtTogether: HomeProduct[];
  youMayAlsoLike: HomeProduct[];
  cheaperAlternatives: HomeProduct[];
  fromSameStore: HomeProduct[];
}

export interface HomeRecommendations {
  forYou: HomeProduct[];
  trending: HomeProduct[];
  flashDeals: HomeProduct[];
  newArrivals: HomeProduct[];
  brandsYouLove: HomeProduct[];
}

/**
 * Fetch home page recommendations
 * GET /api/recommendations/home
 */
export const getHomeRecommendations = async (): Promise<HomeRecommendations> => {
  try {
    const response = await axiosInstance.get('/recommendations/home');
    
    const data = response.data?.data || response.data;
    
    if (!data) {
      throw new Error('Invalid response structure');
    }

    return {
      forYou: data.forYou || [],
      trending: data.trending || [],
      flashDeals: data.flashDeals || [],
      newArrivals: data.newArrivals || [],
      brandsYouLove: data.brandsYouLove || [],
    };
  } catch (error: any) {
    console.error('Error fetching home recommendations:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load home recommendations'
    );
  }
};

/**
 * Fetch product recommendations
 * GET /api/recommendations/product/:id
 */
export const getProductRecommendations = async (productId: string): Promise<ProductRecommendations> => {
  try {
    const response = await axiosInstance.get(`/recommendations/product/${productId}`);
    
    const data = response.data?.data || response.data;
    
    if (!data) {
      throw new Error('Invalid response structure');
    }

    return {
      similarItems: data.similarItems || [],
      frequentlyBoughtTogether: data.frequentlyBoughtTogether || [],
      youMayAlsoLike: data.youMayAlsoLike || [],
      cheaperAlternatives: data.cheaperAlternatives || [],
      fromSameStore: data.fromSameStore || [],
    };
  } catch (error: any) {
    console.error('Error fetching product recommendations:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load product recommendations'
    );
  }
};

/**
 * Fetch cart recommendations
 * GET /api/recommendations/cart
 */
export const getCartRecommendations = async (): Promise<HomeProduct[]> => {
  try {
    const response = await axiosInstance.get('/recommendations/cart');
    
    const data = response.data?.data || response.data;
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid response structure');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching cart recommendations:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load cart recommendations'
    );
  }
};

/**
 * Fetch user-specific recommendations
 * GET /api/recommendations/user/:id
 */
export const getUserRecommendations = async (userId: string): Promise<HomeProduct[]> => {
  try {
    const response = await axiosInstance.get(`/recommendations/user/${userId}`);
    
    const data = response.data?.data || response.data;
    
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid response structure');
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching user recommendations:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load user recommendations'
    );
  }
};
