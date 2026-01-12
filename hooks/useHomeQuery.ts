import { useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useHomeStore } from '@/store/useHomeStore';

/**
 * Hook to fetch and manage home screen data
 * Automatically fetches on mount and when screen comes into focus
 */
export const useHomeQuery = () => {
  const {
    banners,
    categories,
    trending,
    flashDeals,
    newArrivals,
    forYou,
    stores,
    isLoading,
    isRefreshing,
    error,
    fetchHomeData,
    refreshHomeData,
    clearError,
  } = useHomeStore();

  // Fetch on mount
  useEffect(() => {
    fetchHomeData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only refresh if data is stale (older than 5 minutes)
      const shouldRefresh = !isLoading && (banners.length === 0 || error);
      if (shouldRefresh) {
        fetchHomeData();
      }
    }, [isLoading, banners.length, error])
  );

  return {
    // Data
    banners,
    categories,
    trending,
    flashDeals,
    newArrivals,
    forYou,
    stores,
    
    // Loading states
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    refetch: fetchHomeData,
    refresh: refreshHomeData,
    clearError,
  };
};
