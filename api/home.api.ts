import axiosInstance from "@/services/api/client";
import type { ProductDTO } from "@/domain/product/product.types";

export interface HomeBanner {
  _id: string;
  id?: string; // Universal ID (maps to _id)
  image: string;
  title?: string;
  description?: string;
  order: number;
  // Deep linking fields
  type?: 'category' | 'store' | 'product' | 'collection' | 'external';
  targetId?: string; // ID of the target entity (category, store, product, etc.)
  url?: string; // For external banners
  slug?: string; // URL-friendly identifier
}

export interface HomeCategory {
  _id: string;
  id?: string; // Universal ID (maps to _id)
  name: string;
  image?: string;
  description?: string;
  // Deep linking fields
  type?: 'category'; // Entity type
  slug?: string; // URL-friendly identifier (e.g., "electronics", "clothing")
}

// Backend Product schema is the source of truth for all product fields.
export type HomeProduct = ProductDTO;

export interface HomeStore {
  _id: string;
  id?: string; // Universal ID (maps to _id)
  name: string;
  description?: string;
  email: string;
  rating: number;
  verified: boolean;
  orderCount: number;
  totalRevenue: number;
  // Deep linking fields
  type?: 'store'; // Entity type
  slug?: string; // URL-friendly identifier (e.g., "best-electronics-store")
}

export interface HomeData {
  banners: HomeBanner[];
  categories: HomeCategory[];
  trending: HomeProduct[];
  flashDeals: HomeProduct[];
  newArrivals: HomeProduct[];
  forYou: HomeProduct[];
  stores: HomeStore[];
}

/**
 * Fetch all home screen data in one optimized call
 */
export const getHomeData = async (): Promise<HomeData> => {
  try {
    const response = await axiosInstance.get('/home');
    
    // Handle different response structures
    const data = response.data?.data || response.data;
    
    if (!data) {
      throw new Error('Invalid response structure');
    }

    return {
      banners: data.banners || [],
      categories: data.categories || [],
      trending: data.trending || [],
      flashDeals: data.flashDeals || [],
      newArrivals: data.newArrivals || [],
      forYou: data.forYou || [],
      stores: data.stores || [],
    };
  } catch (error: any) {
    console.error('Error fetching home data:', error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      'Failed to load home data'
    );
  }
};
