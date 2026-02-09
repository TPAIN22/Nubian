import axiosInstance from "@/services/api/client";
import type { HomeProduct } from "./home.api";

export interface ProductRecommendations {
  similarItems: HomeProduct[];
  frequentlyBoughtTogether: HomeProduct[];
  youMayAlsoLike: HomeProduct[];
  cheaperAlternatives: HomeProduct[];
  fromSameStore: HomeProduct[];
}

export interface HomeRecommendations {
  forYou: HomeProduct[];
  trending: HomeProduct[];
  flashDeals: HomeProduct[];
  newArrivals: HomeProduct[];
  brandsYouLove: HomeProduct[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 350): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 429 && retries > 0) {
      await sleep(delayMs);
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

function unwrapData<T>(response: any): T {
  const data = response?.data?.data ?? response?.data;
  if (!data) throw new Error("Invalid response structure");
  return data as T;
}

function safeList(list: any): HomeProduct[] {
  if (!Array.isArray(list)) return [];
  // فلتر: لازم يكون في _id (أو id حسب أنواعك)
  return list.filter((p) => p && (p._id || (p as any).id));
}

function excludeProduct(list: HomeProduct[], productId?: string) {
  if (!productId) return list;
  return list.filter((p: any) => (p?._id ?? p?.id) !== productId);
}

// ─────────────────────────────────────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch home page recommendations
 * GET /api/recommendations/home
 */
export const getHomeRecommendations = async (currencyCode?: string): Promise<HomeRecommendations> => {
  try {
    const response = await withRetry(() => axiosInstance.get("/recommendations/home", {
      params: { currencyCode }
    }), 1);

    const data = unwrapData<any>(response);

    return {
      forYou: safeList(data.forYou),
      trending: safeList(data.trending),
      flashDeals: safeList(data.flashDeals),
      newArrivals: safeList(data.newArrivals),
      brandsYouLove: safeList(data.brandsYouLove),
    };
  } catch (error: any) {
    console.error("Error fetching home recommendations:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to load home recommendations"
    );
  }
};

/**
 * Fetch product recommendations
 * GET /api/recommendations/product/:id
 */
export const getProductRecommendations = async (productId: string, currencyCode?: string): Promise<ProductRecommendations> => {
  try {
    const response = await withRetry(
      () => axiosInstance.get(`/recommendations/product/${productId}`, {
        params: { currencyCode }
      }),
      1
    );

    const data = unwrapData<any>(response);

    return {
      similarItems: excludeProduct(safeList(data.similarItems), productId),
      frequentlyBoughtTogether: excludeProduct(safeList(data.frequentlyBoughtTogether), productId),
      youMayAlsoLike: excludeProduct(safeList(data.youMayAlsoLike), productId),
      cheaperAlternatives: excludeProduct(safeList(data.cheaperAlternatives), productId),
      fromSameStore: excludeProduct(safeList(data.fromSameStore), productId),
    };
  } catch (error: any) {
    console.error("Error fetching product recommendations:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to load product recommendations"
    );
  }
};

/**
 * Fetch cart recommendations
 * GET /api/recommendations/cart
 */
export const getCartRecommendations = async (currencyCode?: string): Promise<HomeProduct[]> => {
  try {
    const response = await withRetry(() => axiosInstance.get("/recommendations/cart", {
      params: { currencyCode }
    }), 1);
    const data = unwrapData<any>(response);

    // cart endpoint يرجّع Array
    if (!Array.isArray(data)) throw new Error("Invalid response structure");
    return safeList(data);
  } catch (error: any) {
    console.error("Error fetching cart recommendations:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to load cart recommendations"
    );
  }
};

/**
 * Fetch user-specific recommendations
 * GET /api/recommendations/user/:id
 */
export const getUserRecommendations = async (userId: string, currencyCode?: string): Promise<HomeProduct[]> => {
  try {
    const response = await withRetry(
      () => axiosInstance.get(`/recommendations/user/${userId}`, {
        params: { currencyCode }
      }),
      1
    );
    const data = unwrapData<any>(response);

    if (!Array.isArray(data)) throw new Error("Invalid response structure");
    return safeList(data);
  } catch (error: any) {
    console.error("Error fetching user recommendations:", error);
    throw new Error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to load user recommendations"
    );
  }
};
