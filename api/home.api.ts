import axiosInstance from '@/utils/axiosInstans';

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

export interface HomeProduct {
  _id: string;
  id?: string; // Universal ID (maps to _id)
  name: string;
  description: string;
  price: number;
  discountPrice: number;
  discount: number;
  finalPrice: number;
  stock: number;
  hasStock: boolean;
  images: string[];
  averageRating: number;
  category: {
    _id: string;
    id?: string;
    name: string;
    slug?: string;
    type?: 'category';
  };
  merchant?: {
    _id: string;
    id?: string;
    businessName: string;
    status: string;
    type?: 'store';
    slug?: string;
  };
  featured?: boolean;
  priorityScore?: number;
  // Deep linking fields
  type?: 'product'; // Entity type
  slug?: string; // URL-friendly identifier (e.g., "iphone-14-pro-max")
  variants?: Array<{
    _id: string;
    id?: string;
    sku: string;
    price: number;
    discountPrice: number;
    stock: number;
    isActive: boolean;
    attributes: Record<string, string>;
  }>;
}

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
