import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/services/api/client';

// Cache keys
const CACHE_KEYS = {
  COUNTRIES: 'locations_countries',
  CITIES_BY_COUNTRY: 'locations_cities_by_country',
  SUBCITIES_BY_CITY: 'locations_subcities_by_city',
  CACHE_TIMESTAMP: 'locations_cache_timestamp'
};

// Cache TTL (7 days in milliseconds)
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

const useLocationStore = create((set, get) => ({
  // State
  countries: [],
  citiesByCountryId: {},
  subCitiesByCityId: {},
  isLoading: false,
  error: null,
  inFlight: null,

  // Helper functions
  isCacheValid: async () => {
    try {
      const timestamp = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      return (now - cacheTime) < CACHE_TTL;
    } catch (error) {
      return false;
    }
  },

  loadFromCache: async () => {
    try {
      const [countries, citiesByCountryId, subCitiesByCityId] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.COUNTRIES),
        AsyncStorage.getItem(CACHE_KEYS.CITIES_BY_COUNTRY),
        AsyncStorage.getItem(CACHE_KEYS.SUBCITIES_BY_CITY)
      ]);

      if (countries && citiesByCountryId && subCitiesByCityId) {
        set({
          countries: JSON.parse(countries),
          citiesByCountryId: JSON.parse(citiesByCountryId),
          subCitiesByCityId: JSON.parse(subCitiesByCityId)
        });
        return true;
      }
      return false;
    } catch (error) {
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
    } catch (error) {
      // Silently fail cache save
    }
  },

  // Load countries
  loadCountries: async (forceRefresh = false) => {
    const { isLoading, inFlight, isCacheValid, loadFromCache, saveToCache } = get();

    if (isLoading && inFlight) return inFlight;

    // Try to load from cache first if not forcing refresh
    if (!forceRefresh) {
      const cacheLoaded = await loadFromCache();
      if (cacheLoaded) {
        // Check if cache is still valid, if not, refresh in background
        const cacheValid = await isCacheValid();
        if (cacheValid) {
          return get().countries;
        }
      }
    }

    set({ isLoading: true, error: null });
    const task = (async () => {
      try {
        const res = await axiosInstance.get('/locations/countries?active=true');
        const countries = res.data.data || [];

        // Update cache
        await saveToCache(countries, get().citiesByCountryId, get().subCitiesByCityId);

        set({
          countries,
          isLoading: false,
          error: null
        });

        return countries;
      } catch (error) {
        const msg = error?.response?.data?.message || error.message;
        set({ error: msg, isLoading: false });

        // If cache exists, use it as fallback
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

  // Load cities for a country
  loadCities: async (countryId, forceRefresh = false) => {
    if (!countryId) return [];

    const { isLoading, inFlight, citiesByCountryId, saveToCache } = get();

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && citiesByCountryId[countryId]) {
      return citiesByCountryId[countryId];
    }

    set({ isLoading: true, error: null });
    const task = (async () => {
      try {
        const res = await axiosInstance.get(`/locations/countries/${countryId}/cities?active=true`);
        const cities = res.data.data || [];

        // Update cities cache
        const updatedCitiesByCountryId = {
          ...citiesByCountryId,
          [countryId]: cities
        };

        await saveToCache(get().countries, updatedCitiesByCountryId, get().subCitiesByCityId);

        set({
          citiesByCountryId: updatedCitiesByCountryId,
          isLoading: false,
          error: null
        });

        return cities;
      } catch (error) {
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

  // Load subcities for a city
  loadSubCities: async (cityId, forceRefresh = false) => {
    if (!cityId) return [];

    const { isLoading, inFlight, subCitiesByCityId, saveToCache } = get();

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && subCitiesByCityId[cityId]) {
      return subCitiesByCityId[cityId];
    }

    set({ isLoading: true, error: null });
    const task = (async () => {
      try {
        const res = await axiosInstance.get(`/locations/cities/${cityId}/subcities?active=true`);
        const subCities = res.data.data || [];

        // Update subcities cache
        const updatedSubCitiesByCityId = {
          ...subCitiesByCityId,
          [cityId]: subCities
        };

        await saveToCache(get().countries, get().citiesByCountryId, updatedSubCitiesByCityId);

        set({
          subCitiesByCityId: updatedSubCitiesByCityId,
          isLoading: false,
          error: null
        });

        return subCities;
      } catch (error) {
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

  // Get cached cities for a country (doesn't trigger API call)
  getCitiesForCountry: (countryId) => {
    return get().citiesByCountryId[countryId] || [];
  },

  // Get cached subcities for a city (doesn't trigger API call)
  getSubCitiesForCity: (cityId) => {
    return get().subCitiesByCityId[cityId] || [];
  },

  // Clear cache
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
    } catch (error) {
      // Silently fail
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Initialize - load from cache on app start
  initialize: async () => {
    const cacheLoaded = await get().loadFromCache();
    if (cacheLoaded) {
      // Load fresh data in background if cache is stale
      const cacheValid = await get().isCacheValid();
      if (!cacheValid) {
        get().loadCountries(true).catch(() => {
          // Silently fail background refresh
        });
      }
    } else {
      // No cache, load fresh data
      get().loadCountries().catch(() => {
        // Silently fail initial load
      });
    }
  }
}));

export default useLocationStore;