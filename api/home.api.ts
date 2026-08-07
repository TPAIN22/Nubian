import axiosInstance from "@/services/api/client";
import { normalizeProduct, type NormalizedProduct } from "@/domain/product/product.normalize";
import type { BannerTarget } from "@/utils/bannerTarget";

export interface HomeBanner {
  _id: string;
  id?: string; // Universal ID (maps to _id)
  image: string;
  title?: string;
  description?: string;
  order: number;
  /**
   * Where tapping the banner goes. Absent on banners created before targets
   * existed, which `resolveBannerTarget` reads as `{ type: 'none' }`.
   */
  target?: BannerTarget;
  // Legacy flat deep-link fields. The API never emitted these; kept so a cached
  // payload still resolves. See `utils/bannerTarget.ts`.
  type?: 'category' | 'store' | 'product' | 'collection' | 'external';
  targetId?: string;
  url?: string;
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

// HomeProduct is normalized at the API boundary so downstream code never
// re-runs normalizeProduct (was a duplication smell — and any new code path
// that read raw fields could resurface currency-leak bugs).
export type HomeProduct = NormalizedProduct;

/**
 * A curated collection, as it appears on the home rail.
 *
 * Summary only — the products arrive when the shopper taps through to
 * `/(screens)/collection/[id]`, so the home payload stays small no matter how
 * many products a collection holds.
 */
export interface HomeCollection {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string | null;
  productCount?: number;
  type?: 'collection';
}

export interface HomeStore {
  _id: string;
  id?: string;
  name: string;
  rating: number;
  verified: boolean;
  logo?: string | null;
  banner?: string | null;
  type?: 'store';
}

export interface HomeData {
  banners: HomeBanner[];
  categories: HomeCategory[];
  collections: HomeCollection[];
  trending: HomeProduct[];
  flashDeals: HomeProduct[];
  newArrivals: HomeProduct[];
  forYou: HomeProduct[];
  brandsYouLove: HomeProduct[];
  stores: HomeStore[];
}

/**
 * Fetch all home screen data in one optimized call
 */
export const getHomeData = async (currencyCode?: string): Promise<HomeData> => {
  try {
    const response = await axiosInstance.get('home', {
      params: { currencyCode }
    });
    
    // Handle different response structures
    const data = response.data?.data || response.data;
    
    if (!data) {
      throw new Error('Invalid response structure');
    }

    const norm = (list: any): NormalizedProduct[] =>
      Array.isArray(list) ? list.map(normalizeProduct) : [];

    return {
      banners: data.banners || [],
      categories: data.categories || [],
      // Absent from an older backend or a cached payload written before the
      // home rail existed — an empty list simply hides the section.
      collections: data.collections || [],
      trending:      norm(data.trending),
      flashDeals:    norm(data.flashDeals),
      newArrivals:   norm(data.newArrivals),
      forYou:        norm(data.forYou),
      brandsYouLove: norm(data.brandsYouLove),
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
