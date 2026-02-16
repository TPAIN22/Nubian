import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/services/api/client';

/**
 * Currency preference types
 */
interface Country {
  code: string;
  nameEn: string;
  nameAr: string;
  defaultCurrencyCode: string;
}

interface Currency {
  code: string;
  name: string;
  nameAr?: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimals: number;
  roundingStrategy: string;
}

interface CurrencyState {
  // User preferences
  countryCode: string | null;
  currencyCode: string | null;
  
  // Available options (fetched from API)
  countries: Country[];
  currencies: Currency[];
  
  // Loading states
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPreferencesFromStorage: () => Promise<void>;
  fetchMetadata: () => Promise<void>;
  setCountry: (countryCode: string) => void;
  setCurrency: (currencyCode: string) => void;
  savePreferences: (countryCode: string, currencyCode: string, userId?: string) => Promise<void>;
  syncWithBackend: (userId: string) => Promise<void>;
  reset: () => void;
  
  // Computed helpers
  getSelectedCurrency: () => Currency | null;
  getSelectedCountry: () => Country | null;
  formatPrice: (amount: number) => string;
}

const STORAGE_KEY = 'nubian_currency_prefs';

export const useCurrencyStore = create<CurrencyState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // Initial state
      countryCode: null,
      currencyCode: null,
      countries: [],
      currencies: [],
      isLoaded: false,
      isLoading: false,
      error: null,

      // Load preferences from AsyncStorage (already handled by persist middleware)
      loadPreferencesFromStorage: async () => {
        // The persist middleware handles this automatically
        set({ isLoaded: true });
      },

      // Fetch countries and currencies from API
      fetchMetadata: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axiosInstance.get('meta/all');
          const { countries, currencies } = response.data.data;
          
          set({
            countries: countries || [],
            currencies: currencies || [],
            isLoading: false,
            isLoaded: true,
          });
        } catch (error: any) {
          console.error('Failed to fetch currency metadata:', error.message);
          set({
            error: 'Failed to load currency options',
            isLoading: false,
          });
        }
      },

      // Set country (also auto-selects default currency)
      setCountry: (countryCode: string) => {
        const { countries } = get();
        const country = countries.find(c => c.code === countryCode);
        
        set({
          countryCode,
          currencyCode: country?.defaultCurrencyCode || 'USD',
        });
      },

      // Set currency
      setCurrency: (currencyCode: string) => {
        set({ currencyCode });
      },

      // Save preferences to AsyncStorage and optionally sync with backend
      savePreferences: async (countryCode: string, currencyCode: string, userId?: string) => {
        set({ countryCode, currencyCode });
        
        // If user is logged in, sync to backend
        if (userId) {
          await get().syncWithBackend(userId);
        }
      },

      // Sync preferences to backend
      syncWithBackend: async (userId: string) => {
        try {
          const { countryCode, currencyCode } = get();
          
          if (!countryCode || !currencyCode) return;
          
          await axiosInstance.put('me/preferences', {
            countryCode,
            currencyCode,
          });
          
          console.log(`Currency preferences synced to backend for user: ${userId}`);
        } catch (error: any) {
          console.error('Failed to sync preferences:', error.message);
          // Don't set error - local storage still works
        }
      },

      // Reset state
      reset: () => {
        set({
          countryCode: null,
          currencyCode: null,
          isLoaded: false,
          error: null,
        });
      },

      // Get selected currency object
      getSelectedCurrency: () => {
        const { currencies, currencyCode } = get();
        return currencies.find(c => c.code === currencyCode) || null;
      },

      // Get selected country object
      getSelectedCountry: () => {
        const { countries, countryCode } = get();
        return countries.find(c => c.code === countryCode) || null;
      },

      // Format price with currency symbol
      formatPrice: (amount: number | undefined | null) => {
        const safeAmount = Number(amount) || 0;
        const currency = get().getSelectedCurrency();
        
        if (!currency) {
          return `$${safeAmount.toFixed(2)}`;
        }
        
        const formatted = safeAmount.toFixed(currency.decimals);
        
        if (currency.symbolPosition === 'after') {
          return `${formatted} ${currency.symbol}`;
        }
        return `${currency.symbol}${formatted}`;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        countryCode: state.countryCode,
        currencyCode: state.currencyCode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
        }
      },
    }
    )
  )
);

// Selector hooks for performance
export const useSelectedCurrency = () => useCurrencyStore(state => state.currencyCode);
export const useSelectedCountry = () => useCurrencyStore(state => state.countryCode);
export const useHasSelectedCurrency = () => useCurrencyStore(state => !!state.currencyCode && !!state.countryCode);
export const useCurrencyLoaded = () => useCurrencyStore(state => state.isLoaded);
