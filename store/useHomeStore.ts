import { create } from "zustand";
import { HomeService } from "../services/home.service";
import { useCurrencyStore } from "./useCurrencyStore";

interface HomeState {
  banners: any[];
  categories: any[];
  collections: any[];
  trending: any[];
  flashDeals: any[];
  newArrivals: any[];
  forYou: any[];
  brandsYouLove: any[];
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

const HARD_TIMEOUT_MS = 20_000;

function withHardTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

async function buildHomePayload(currencyCode?: string) {
  const homeData = await HomeService.fetchHomeData(currencyCode);

  return {
    banners:       HomeService.filterActiveBanners(homeData.banners),
    categories:    HomeService.filterActiveCategories(homeData.categories),
    collections:   HomeService.filterActiveCollections(homeData.collections),
    trending:      HomeService.filterAvailableProducts(homeData.trending      || []),
    flashDeals:    HomeService.filterAvailableProducts(homeData.flashDeals    || []),
    newArrivals:   HomeService.filterAvailableProducts(homeData.newArrivals   || []),
    forYou:        HomeService.filterAvailableProducts(homeData.forYou        || []),
    brandsYouLove: HomeService.filterAvailableProducts(homeData.brandsYouLove || []),
    stores:        HomeService.filterVerifiedStores(homeData.stores),
  };
}

const initialState = {
  banners: [],
  categories: [],
  collections: [],
  trending: [],
  flashDeals: [],
  newArrivals: [],
  forYou: [],
  brandsYouLove: [],
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
        const payload = await withHardTimeout(
          buildHomePayload(currencyCode),
          HARD_TIMEOUT_MS,
          "home fetch",
        );
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
      const payload = await withHardTimeout(
        buildHomePayload(currencyCode),
        HARD_TIMEOUT_MS,
        "home refresh",
      );
      set({ ...payload, isRefreshing: false, error: null, lastFetchedAt: Date.now() });
    } catch (error: any) {
      set({ isRefreshing: false, error: error?.message || "Failed to refresh home data" });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
