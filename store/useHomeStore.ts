import { create } from "zustand";
import { HomeService } from "../services/home.service";
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

  lastFetchedAt: number | null;
  inFlight: Promise<void> | null;
  inFlightCurrency: string | undefined;

  fetchHomeData: () => Promise<void>;
  refreshHomeData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

async function buildHomePayload(currencyCode?: string) {
  const homeData = await HomeService.fetchHomeData(currencyCode);

  return {
    banners:     HomeService.filterActiveBanners(homeData.banners),
    categories:  HomeService.filterActiveCategories(homeData.categories),
    trending:    HomeService.filterAvailableProducts(homeData.trending    || []),
    flashDeals:  HomeService.filterAvailableProducts(homeData.flashDeals  || []),
    newArrivals: HomeService.filterAvailableProducts(homeData.newArrivals || []),
    forYou:      HomeService.filterAvailableProducts(homeData.forYou      || []),
    stores:      HomeService.filterVerifiedStores(homeData.stores),
  };
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
  inFlightCurrency: undefined,
};

export const useHomeStore = create<HomeState>((set, get) => ({
  ...initialState,

  fetchHomeData: async () => {
    const currencyCode = useCurrencyStore.getState().currencyCode || undefined;
    const { isLoading, inFlight, inFlightCurrency } = get();
    // Reuse in-flight only when it was started for the same currency
    if (isLoading && inFlight && inFlightCurrency === currencyCode) return inFlight;

    set({ isLoading: true, error: null, inFlightCurrency: currencyCode });

    const task = (async () => {
      try {
        const payload = await buildHomePayload(currencyCode);
        set({ ...payload, isLoading: false, error: null, lastFetchedAt: Date.now() });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error?.message || "Failed to load home data",
          lastFetchedAt: Date.now(),
        });
      } finally {
        set({ inFlight: null, inFlightCurrency: undefined });
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
      const payload = await buildHomePayload(currencyCode);
      set({ ...payload, isRefreshing: false, error: null, lastFetchedAt: Date.now() });
    } catch (error: any) {
      set({ isRefreshing: false, error: error?.message || "Failed to refresh home data" });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
