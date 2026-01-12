import { create } from 'zustand';
import { 
  ExploreProduct, 
  ExploreFilters, 
  ExploreSort, 
  ExploreParams,
  getExploreProducts 
} from '../api/explore.api';

interface ExploreState {
  // Data
  products: ExploreProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;

  // Filters & Sort
  filters: ExploreFilters;
  sort: ExploreSort;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  fetchProducts: (params?: ExploreParams) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: Partial<ExploreFilters>) => void;
  setSort: (sort: ExploreSort) => void;
  clearFilters: () => void;
  reset: () => void;
}

const DEFAULT_FILTERS: ExploreFilters = {};
const DEFAULT_SORT: ExploreSort = 'recommended';
const DEFAULT_LIMIT = 20;

const initialState: Omit<ExploreState, 'fetchProducts' | 'loadMore' | 'refresh' | 'setFilters' | 'setSort' | 'clearFilters' | 'reset'> = {
  products: [],
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 0,
  hasMore: false,
  filters: DEFAULT_FILTERS,
  sort: DEFAULT_SORT,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
};

export const useExploreStore = create<ExploreState>((set, get) => ({
  ...initialState,

  fetchProducts: async (params?: ExploreParams) => {
    const { isLoading } = get();
    // Allow fetch even if loading if params are explicitly provided (e.g., from filter changes)
    // This ensures filter changes always trigger a new fetch
    if (isLoading && !params) return;

    set({ isLoading: true, error: null });

    try {
      const { filters, sort, page, limit } = get();
      
      // Merge params with current state, but params take precedence
      const queryParams: ExploreParams = {
        ...filters,
        sort: params?.sort || sort,
        page: params?.page || page || 1,
        limit: params?.limit || limit,
        // Override with explicit params (they take highest priority)
        ...params,
      };

      const response = await getExploreProducts(queryParams);

      // Update state with response and any params that were passed
      set({
        products: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasMore: response.page < response.totalPages,
        isLoading: false,
        error: null,
        // Update sort if it was passed in params
        ...(params?.sort && { sort: params.sort }),
        // Update filters if they were passed in params
        ...(params && Object.keys(params).some(key => key !== 'sort' && key !== 'page' && key !== 'limit') && {
          filters: { ...filters, ...params }
        }),
      });
    } catch (error: any) {
      console.error('Error fetching explore products:', error);
      set({
        isLoading: false,
        error: error?.message || 'Failed to load explore products',
      });
    }
  },

  loadMore: async () => {
    const { isLoadingMore, hasMore, page, limit, filters, sort } = get();
    if (isLoadingMore || !hasMore) return;

    set({ isLoadingMore: true, error: null });

    try {
      const nextPage = page + 1;
      const response = await getExploreProducts({
        ...filters,
        sort,
        page: nextPage,
        limit,
      });

      const { products } = get();
      set({
        products: [...products, ...response.data],
        page: nextPage,
        hasMore: response.page < response.totalPages,
        isLoadingMore: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoadingMore: false,
        error: error?.message || 'Failed to load more products',
      });
    }
  },

  refresh: async () => {
    set({ isRefreshing: true, error: null });

    try {
      const { filters, sort, limit } = get();
      const response = await getExploreProducts({
        ...filters,
        sort,
        page: 1,
        limit,
      });

      set({
        products: response.data,
        total: response.total,
        page: 1,
        totalPages: response.totalPages,
        hasMore: response.page < response.totalPages,
        isRefreshing: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isRefreshing: false,
        error: error?.message || 'Failed to refresh products',
      });
    }
  },

  setFilters: (newFilters: Partial<ExploreFilters>) => {
    // Replace filters completely (don't merge) to allow clearing
    // Remove undefined values to properly clear filters
    const cleanedFilters: ExploreFilters = {};
    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key as keyof ExploreFilters];
      if (value !== undefined && value !== null && value !== '') {
        cleanedFilters[key as keyof ExploreFilters] = value;
      }
    });
    
    console.log('Store: Setting filters and fetching from API:', cleanedFilters);
    
    set({ filters: cleanedFilters, page: 1 });
    // Automatically fetch with new filters - this fetches from API
    const { sort, limit } = get();
    // Call fetchProducts which will make API call to /products/explore with filters
    get().fetchProducts({ ...cleanedFilters, sort, page: 1, limit }).catch(error => {
      console.error('Error fetching products with filters:', error);
    });
  },

  setSort: (sort: ExploreSort) => {
    set({ sort, page: 1 });
    // Automatically fetch with new sort
    get().fetchProducts({ sort, page: 1 });
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS, sort: DEFAULT_SORT, page: 1 });
    // Fetch with empty filters to show all products
    const { limit } = get();
    get().fetchProducts({ sort: DEFAULT_SORT, page: 1, limit });
  },

  reset: () => set(initialState),
}));
