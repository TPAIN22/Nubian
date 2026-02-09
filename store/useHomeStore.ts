import { create } from "zustand";
import { HomeService } from "../services/home.service";
import { getHomeRecommendations } from "../api/recommendations.api";
import { useCurrencyStore } from "./useCurrencyStore";

interface HomeState {
  banners: any[];
  categories: any[];
  trending: any[];
  flashDeals: any[];
  newArrivals: any[];
  forYou: any[];
  stores: any[];

  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  lastFetchedAt: number | null;   // ✅ جديد
  inFlight: Promise<void> | null; // ✅ dedupe

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
  lastFetchedAt: null,
  inFlight: null,
};

export const useHomeStore = create<HomeState>((set, get) => ({
  ...initialState,

  fetchHomeData: async () => {
    const { isLoading, inFlight } = get();
    if (isLoading && inFlight) return inFlight;

    // ✅ Set loading IMMEDIATELY before starting the task
    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const currencyCode = useCurrencyStore.getState().currencyCode || undefined;
        const [homeData, recommendations] = await Promise.all([
          HomeService.fetchHomeData(currencyCode),
          getHomeRecommendations(currencyCode).catch(() => null),
        ]);

        const activeCategories = HomeService.filterActiveCategories(homeData.categories);
        const activeBanners = HomeService.filterActiveBanners(homeData.banners);
        const verifiedStores = HomeService.filterVerifiedStores(homeData.stores);

        const hasRecommendations =
          recommendations &&
          (recommendations.trending?.length ||
            recommendations.forYou?.length ||
            recommendations.flashDeals?.length ||
            recommendations.newArrivals?.length);

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
          lastFetchedAt: Date.now(),
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error?.message || "Failed to load home data",
          lastFetchedAt: Date.now(), // ✅ Update even on error to prevent focus loop
        });
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });
    return task;
  },

  refreshHomeData: async () => {
    // ✅ refresh ما يعمل duplicate لو في fetch شغال
    const { inFlight } = get();
    if (inFlight) return inFlight;

    set({ isRefreshing: true, error: null });

    try {
      const currencyCode = useCurrencyStore.getState().currencyCode || undefined;
      const [homeData, recommendations] = await Promise.all([
        HomeService.fetchHomeData(currencyCode),
        getHomeRecommendations(currencyCode).catch(() => null),
      ]);

      const activeCategories = HomeService.filterActiveCategories(homeData.categories);
      const activeBanners = HomeService.filterActiveBanners(homeData.banners);
      const verifiedStores = HomeService.filterVerifiedStores(homeData.stores);

      const hasRecommendations =
        recommendations &&
        (recommendations.trending?.length ||
          recommendations.forYou?.length ||
          recommendations.flashDeals?.length ||
          recommendations.newArrivals?.length);

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
        lastFetchedAt: Date.now(), // ✅
      });
    } catch (error: any) {
      set({
        isRefreshing: false,
        error: error?.message || "Failed to refresh home data",
      });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
