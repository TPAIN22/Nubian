import { useEffect, useRef, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useHomeStore } from "@/store/useHomeStore";

const STALE_MS = 5 * 60 * 1000;

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
    lastFetchedAt, // 👈 هنضيفها في الستور
  } = useHomeStore();

  const didInitialFetchRef = useRef(false);

  // Fetch on mount (مرة واحدة فقط)
  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;

    // لو عندك بيانات موجودة وما stale ما تعمل fetch
    const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
    if ((banners.length === 0 && !isLoading) || (isStale && !isLoading)) {
      fetchHomeData();
    }
  }, [fetchHomeData, banners.length, isLoading, lastFetchedAt]);

  // Focus refresh — فقط لو stale. 
  // ما نضيف error هنا عشان ما نعمل infinite loop لو السيرفر وقع
  useFocusEffect(
    useCallback(() => {
      const isStale = !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
      const shouldRefresh = !isLoading && !isRefreshing && isStale;

      if (shouldRefresh) fetchHomeData();
    }, [fetchHomeData, isLoading, isRefreshing, lastFetchedAt])
  );

  return {
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
    refetch: fetchHomeData,
    refresh: refreshHomeData,
    clearError,
  };
};
