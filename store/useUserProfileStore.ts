import { create } from 'zustand';

interface UserIntelligence {
  viewedProducts: Array<{
    product: string;
    viewedAt: Date;
    viewCount: number;
  }>;
  clickedProducts: Array<{
    product: string;
    clickedAt: Date;
    clickCount: number;
  }>;
  cartEvents: Array<{
    product: string;
    eventType: 'add' | 'remove';
    timestamp: Date;
  }>;
  searchKeywords: Array<{
    keyword: string;
    searchedAt: Date;
    searchCount: number;
  }>;
  purchasedCategories: Array<{
    category: string;
    purchaseCount: number;
    lastPurchasedAt: Date;
  }>;
  preferredPriceRange: {
    min: number | null;
    max: number | null;
  };
  preferredSizes: string[];
  preferredBrands: string[];
  deviceType: 'mobile' | 'tablet' | 'desktop';
  lastActive: Date;
}

interface UserProfileState {
  intelligence: UserIntelligence | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setIntelligence: (intelligence: UserIntelligence) => void;
  clearIntelligence: () => void;
  reset: () => void;
}

const initialState = {
  intelligence: null,
  isLoading: false,
  error: null,
};

const defaultIntelligence: UserIntelligence = {
  viewedProducts: [],
  clickedProducts: [],
  cartEvents: [],
  searchKeywords: [],
  purchasedCategories: [],
  preferredPriceRange: {
    min: null,
    max: null,
  },
  preferredSizes: [],
  preferredBrands: [],
  deviceType: 'mobile',
  lastActive: new Date(),
};

export const useUserProfileStore = create<UserProfileState>((set) => ({
  ...initialState,

  setIntelligence: (intelligence: UserIntelligence) => {
    set({ intelligence });
  },

  clearIntelligence: () => {
    set({ intelligence: null });
  },

  reset: () => set(initialState),
}));

// Selectors for easy access
export const useUserIntelligence = () => useUserProfileStore((state) => state.intelligence);
export const useUserIntelligenceLoading = () => useUserProfileStore((state) => state.isLoading);
export const useUserIntelligenceError = () => useUserProfileStore((state) => state.error);
