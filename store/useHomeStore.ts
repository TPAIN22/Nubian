import { create } from 'zustand';
import { HomeData, HomeProduct, HomeCategory, HomeBanner, HomeStore } from '../app/_api/home.api';
import { HomeService } from '../app/_services/home.service';
import { getHomeRecommendations } from '../app/_api/recommendations.api';

interface HomeState {
  // Data
  banners: HomeBanner[];
  categories: HomeCategory[];
  trending: HomeProduct[];
  flashDeals: HomeProduct[];
  newArrivals: HomeProduct[];
  forYou: HomeProduct[];
  stores: HomeStore[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  fetchHomeData: () => Promise<void>;
  refreshHomeData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  banners: [],
  categories: [],
  trending: [],
  flashDeals: [],
  newArrivals: [],
  forYou: [],
  stores: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
};

export const useHomeStore = create<HomeState>((set, get) => ({
  ...initialState,

  fetchHomeData: async () => {
    const { isLoading } = get();
    if (isLoading) return; // Prevent duplicate calls

    set({ isLoading: true, error: null });

    try {
      // Fetch banners, categories, and stores from home endpoint
      // Fetch product recommendations from recommendations API
      const [homeData, recommendations] = await Promise.all([
        HomeService.fetchHomeData(),
        getHomeRecommendations().catch(() => null), // Fallback gracefully if recommendations fail
      ]);

      // Filter banners, categories, and stores from home data
      const activeCategories = HomeService.filterActiveCategories(homeData.categories);
      const activeBanners = HomeService.filterActiveBanners(homeData.banners);
      const verifiedStores = HomeService.filterVerifiedStores(homeData.stores);

      // Use recommendations API for product sections (AI-powered)
      // Fallback to home data if recommendations fail or return empty arrays
      const hasRecommendations = recommendations && 
        (recommendations.trending?.length > 0 || recommendations.forYou?.length > 0 || 
         recommendations.flashDeals?.length > 0 || recommendations.newArrivals?.length > 0);
      
      const trending = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.trending || [])
        : HomeService.filterAvailableProducts(homeData.trending || []);
      const flashDeals = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.flashDeals || [])
        : HomeService.filterAvailableProducts(homeData.flashDeals || []);
      const newArrivals = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.newArrivals || [])
        : HomeService.filterAvailableProducts(homeData.newArrivals || []);
      const forYou = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.forYou || [])
        : HomeService.filterAvailableProducts(homeData.forYou || []);

      set({
        banners: activeBanners,
        categories: activeCategories,
        trending,
        flashDeals,
        newArrivals,
        forYou,
        stores: verifiedStores,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.message || 'Failed to load home data',
      });
    }
  },

  refreshHomeData: async () => {
    set({ isRefreshing: true, error: null });

    try {
      // Fetch banners, categories, and stores from home endpoint
      // Fetch product recommendations from recommendations API
      const [homeData, recommendations] = await Promise.all([
        HomeService.fetchHomeData(),
        getHomeRecommendations().catch(() => null), // Fallback gracefully if recommendations fail
      ]);

      // Filter banners, categories, and stores from home data
      const activeCategories = HomeService.filterActiveCategories(homeData.categories);
      const activeBanners = HomeService.filterActiveBanners(homeData.banners);
      const verifiedStores = HomeService.filterVerifiedStores(homeData.stores);

      // Use recommendations API for product sections (AI-powered)
      // Fallback to home data if recommendations fail or return empty arrays
      const hasRecommendations = recommendations && 
        (recommendations.trending?.length > 0 || recommendations.forYou?.length > 0 || 
         recommendations.flashDeals?.length > 0 || recommendations.newArrivals?.length > 0);
      
      const trending = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.trending || [])
        : HomeService.filterAvailableProducts(homeData.trending || []);
      const flashDeals = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.flashDeals || [])
        : HomeService.filterAvailableProducts(homeData.flashDeals || []);
      const newArrivals = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.newArrivals || [])
        : HomeService.filterAvailableProducts(homeData.newArrivals || []);
      const forYou = hasRecommendations
        ? HomeService.filterAvailableProducts(recommendations.forYou || [])
        : HomeService.filterAvailableProducts(homeData.forYou || []);

      set({
        banners: activeBanners,
        categories: activeCategories,
        trending,
        flashDeals,
        newArrivals,
        forYou,
        stores: verifiedStores,
        isRefreshing: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isRefreshing: false,
        error: error?.message || 'Failed to refresh home data',
      });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
