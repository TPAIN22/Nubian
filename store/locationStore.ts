import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/services/api/client';

// ===== Types =====
type Country = {
  _id: string;
  name: string;
};

type City = {
  _id: string;
  name: string;
  country: string;
};

type SubCity = {
  _id: string;
  name: string;
  city: string;
};

type LocationStore = {
  countries: Country[];
  citiesByCountryId: Record<string, City[]>;
  subCitiesByCityId: Record<string, SubCity[]>;
  isLoading: boolean;
  error: string | null;
  inFlight: Promise<any> | null;

  // methods
  isCacheValid: () => Promise<boolean>;
  loadFromCache: () => Promise<boolean>;
  saveToCache: (
    countries: Country[],
    citiesByCountryId: Record<string, City[]>,
    subCitiesByCityId: Record<string, SubCity[]>
  ) => Promise<void>;

  loadCountries: (forceRefresh?: boolean) => Promise<Country[]>;
  loadCities: (countryId: string, forceRefresh?: boolean) => Promise<City[]>;
  loadSubCities: (cityId: string, forceRefresh?: boolean) => Promise<SubCity[]>;

  getCitiesForCountry: (countryId: string) => City[];
  getSubCitiesForCity: (cityId: string) => SubCity[];

  clearCache: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
};

// ===== Cache keys =====
const CACHE_KEYS = {
  COUNTRIES: 'locations_countries',
  CITIES_BY_COUNTRY: 'locations_cities_by_country',
  SUBCITIES_BY_CITY: 'locations_subcities_by_city',
  CACHE_TIMESTAMP: 'locations_cache_timestamp'
};

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ===== Store =====
const useLocationStore = create<LocationStore>((set, get) => ({
  countries: [],
  citiesByCountryId: {},
  subCitiesByCityId: {},
  isLoading: false,
  error: null,
  inFlight: null,

  isCacheValid: async () => {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      return Date.now() - cacheTime < CACHE_TTL;
    } catch {
      return false;
    }
  },

  loadFromCache: async () => {
    try {
      const [countries, cities, subCities] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.COUNTRIES),
        AsyncStorage.getItem(CACHE_KEYS.CITIES_BY_COUNTRY),
        AsyncStorage.getItem(CACHE_KEYS.SUBCITIES_BY_CITY)
      ]);

      if (countries && cities && subCities) {
        set({
          countries: JSON.parse(countries),
          citiesByCountryId: JSON.parse(cities),
          subCitiesByCityId: JSON.parse(subCities)
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  saveToCache: async (countries, citiesByCountryId, subCitiesByCityId) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.COUNTRIES, JSON.stringify(countries)),
        AsyncStorage.setItem(CACHE_KEYS.CITIES_BY_COUNTRY, JSON.stringify(citiesByCountryId)),
        AsyncStorage.setItem(CACHE_KEYS.SUBCITIES_BY_CITY, JSON.stringify(subCitiesByCityId)),
        AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString())
      ]);
    } catch {
      // ignore
    }
  },

  loadCountries: async (forceRefresh = false) => {
    const { isLoading, inFlight, isCacheValid, loadFromCache, saveToCache } = get();

    if (isLoading && inFlight) return inFlight;

    if (!forceRefresh) {
      const cacheLoaded = await loadFromCache();
      if (cacheLoaded) {
        const valid = await isCacheValid();
        if (valid) return get().countries;
      }
    }

    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const res = await axiosInstance.get('/locations/countries?active=true');
        const countries: Country[] = res.data.data || [];

        await saveToCache(countries, get().citiesByCountryId, get().subCitiesByCityId);

        set({ countries, isLoading: false, error: null });
        return countries;
      } catch (error: any) {
        const msg = error?.response?.data?.message || error.message;
        set({ error: msg, isLoading: false });

        if (!forceRefresh) {
          await loadFromCache();
        }

        throw error;
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });
    return task;
  },

  loadCities: async (countryId, forceRefresh = false) => {
    if (!countryId) return [];

    const { citiesByCountryId, saveToCache } = get();

    if (!forceRefresh && citiesByCountryId[countryId]) {
      return citiesByCountryId[countryId];
    }

    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const res = await axiosInstance.get(`/locations/countries/${countryId}/cities?active=true`);
        const cities: City[] = res.data.data || [];

        const updated = {
          ...citiesByCountryId,
          [countryId]: cities
        };

        await saveToCache(get().countries, updated, get().subCitiesByCityId);

        set({ citiesByCountryId: updated, isLoading: false, error: null });

        return cities;
      } catch (error: any) {
        const msg = error?.response?.data?.message || error.message;
        set({ error: msg, isLoading: false });
        throw error;
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });
    return task;
  },

  loadSubCities: async (cityId, forceRefresh = false) => {
    if (!cityId) return [];

    const { subCitiesByCityId, saveToCache } = get();

    if (!forceRefresh && subCitiesByCityId[cityId]) {
      return subCitiesByCityId[cityId];
    }

    set({ isLoading: true, error: null });

    const task = (async () => {
      try {
        const res = await axiosInstance.get(`/locations/cities/${cityId}/subcities?active=true`);
        const subCities: SubCity[] = res.data.data || [];

        const updated = {
          ...subCitiesByCityId,
          [cityId]: subCities
        };

        await saveToCache(get().countries, get().citiesByCountryId, updated);

        set({ subCitiesByCityId: updated, isLoading: false, error: null });

        return subCities;
      } catch (error: any) {
        const msg = error?.response?.data?.message || error.message;
        set({ error: msg, isLoading: false });
        throw error;
      } finally {
        set({ inFlight: null });
      }
    })();

    set({ inFlight: task });
    return task;
  },

  getCitiesForCountry: (countryId) => {
    return get().citiesByCountryId[countryId] || [];
  },

  getSubCitiesForCity: (cityId) => {
    return get().subCitiesByCityId[cityId] || [];
  },

  clearCache: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.COUNTRIES),
        AsyncStorage.removeItem(CACHE_KEYS.CITIES_BY_COUNTRY),
        AsyncStorage.removeItem(CACHE_KEYS.SUBCITIES_BY_CITY),
        AsyncStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP)
      ]);

      set({
        countries: [],
        citiesByCountryId: {},
        subCitiesByCityId: {}
      });
    } catch {
      // ignore
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    const loaded = await get().loadFromCache();

    if (loaded) {
      const valid = await get().isCacheValid();
      if (!valid) {
        get().loadCountries(true).catch(() => {});
      }
    } else {
      get().loadCountries().catch(() => {});
    }
  }
}));

export default useLocationStore;