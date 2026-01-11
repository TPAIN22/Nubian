/**
 * Universal Deep-Linking System for Nubian App
 * 
 * Every UI element that represents data must navigate somewhere meaningful.
 * This utility provides functions to generate deep links for all entity types.
 */

import { router } from 'expo-router';
import { Linking } from 'react-native';

// ============================================================================
// GLOBAL ROUTING PATHS
// ============================================================================
// Note: These map to actual route files in the app directory
// Universal routes (can be referenced anywhere) vs actual file paths

export const ROUTES = {
  // Actual route paths (Expo Router file-based routing)
  PRODUCT: '/(screens)/details/[details]',
  CATEGORY: '/(screens)/[id]',
  STORE: '/(screens)/store/[id]',
  COLLECTION: '/(screens)/[id]', // Can be extended later for collections
  SEARCH: '/(tabs)/explor',
  CART: '/(tabs)/cart',
  PROFILE: '/(tabs)/profile',
  ORDERS: '/(screens)/order',
  WISHLIST: '/(tabs)/wishlist',
} as const;

// ============================================================================
// DEEP LINK GENERATORS
// ============================================================================

/**
 * Navigate to a product page
 * @param productId - Product ID
 * @param product - Optional product object for prefetching
 */
export function navigateToProduct(productId: string, product?: any): void {
  router.push({
    pathname: ROUTES.PRODUCT,
    params: {
      details: productId, // Route expects 'details' param
      // Include product data for optimistic rendering
      ...(product && {
        name: product.name || '',
        price: String(product.price || product.finalPrice || product.discountPrice || 0),
        image: product.images?.[0] || '',
      }),
    },
  } as any);
}

/**
 * Navigate to a category page
 * @param categoryId - Category ID
 * @param category - Optional category object
 */
export function navigateToCategory(categoryId: string, category?: any): void {
  router.push({
    pathname: ROUTES.CATEGORY,
    params: {
      id: categoryId, // Route expects 'id' param
      ...(category && {
        categoryId: categoryId, // Also include for backward compatibility
        categoryName: category.name || '',
        categorySlug: category.slug || category.name?.toLowerCase().replace(/\s+/g, '-') || '',
      }),
    },
  } as any);
}

/**
 * Navigate to a store page
 * @param storeId - Store ID
 * @param store - Optional store object
 */
export function navigateToStore(storeId: string, store?: any): void {
  router.push({
    pathname: ROUTES.STORE,
    params: {
      id: storeId,
      ...(store && {
        name: store.name || store.businessName || '',
      }),
    },
  } as any);
}

/**
 * Navigate to a collection page
 * @param collectionId - Collection ID
 * @param collection - Optional collection object
 */
export function navigateToCollection(collectionId: string, collection?: any): void {
  router.push({
    pathname: ROUTES.COLLECTION,
    params: {
      id: collectionId,
      ...(collection && {
        name: collection.name || '',
      }),
    },
  } as any);
}

/**
 * Navigate to search with filters
 * @param params - Search parameters
 */
export function navigateToSearch(params?: {
  query?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'trending' | 'new' | 'best' | 'rating' | 'price-asc' | 'price-desc';
  discounted?: boolean;
}): void {
  // Build route params object for Expo Router
  const routeParams: Record<string, string> = {};
  
  if (params?.query) routeParams.q = params.query;
  if (params?.category) routeParams.category = params.category;
  if (params?.categoryId) routeParams.categoryId = params.categoryId;
  if (params?.brand) routeParams.brand = params.brand;
  if (params?.tag) routeParams.tag = params.tag;
  if (params?.minPrice !== undefined) routeParams.min = String(params.minPrice);
  if (params?.maxPrice !== undefined) routeParams.max = String(params.maxPrice);
  if (params?.sort) routeParams.sort = params.sort;
  if (params?.discounted) routeParams.discounted = 'true';

  router.push({
    pathname: ROUTES.SEARCH,
    ...(Object.keys(routeParams).length > 0 && { params: routeParams }),
  } as any);
}

/**
 * Navigate to cart
 */
export function navigateToCart(): void {
  router.push('/(tabs)/cart' as any);
}

/**
 * Navigate to profile
 */
export function navigateToProfile(): void {
  router.push('/(tabs)/profile' as any);
}

/**
 * Navigate to orders
 */
export function navigateToOrders(): void {
  router.push('/(screens)/order' as any);
}

/**
 * Navigate to wishlist
 */
export function navigateToWishlist(): void {
  router.push('/(tabs)/wishlist' as any);
}

// ============================================================================
// HOME SECTION DEEP LINKS
// ============================================================================

/**
 * Navigate to trending products
 */
export function navigateToTrending(): void {
  navigateToSearch({ sort: 'trending' });
}

/**
 * Navigate to flash deals (discounted products)
 */
export function navigateToFlashDeals(): void {
  navigateToSearch({ discounted: true });
}

/**
 * Navigate to new arrivals
 */
export function navigateToNewArrivals(): void {
  navigateToSearch({ sort: 'new' });
}

/**
 * Navigate to best sellers
 */
export function navigateToBestSellers(): void {
  navigateToSearch({ sort: 'best' });
}

/**
 * Navigate to top rated products
 */
export function navigateToTopRated(): void {
  navigateToSearch({ sort: 'rating' });
}

/**
 * Navigate to "For You" recommendations
 */
export function navigateToForYou(): void {
  navigateToSearch({ sort: 'trending' }); // Can be customized based on recommendation API
}

// ============================================================================
// BANNER DEEP LINKS
// ============================================================================

/**
 * Handle banner tap navigation
 * @param banner - Banner object with type and targetId
 */
export function navigateBanner(banner: {
  type?: 'category' | 'store' | 'product' | 'collection' | 'external';
  targetId?: string;
  url?: string;
}): void {
  if (!banner.type && !banner.url) {
    console.warn('Banner has no type or URL');
    return;
  }

  switch (banner.type) {
    case 'category':
      if (banner.targetId) {
        navigateToCategory(banner.targetId);
      }
      break;
    case 'store':
      if (banner.targetId) {
        navigateToStore(banner.targetId);
      }
      break;
    case 'product':
      if (banner.targetId) {
        navigateToProduct(banner.targetId);
      }
      break;
    case 'collection':
      if (banner.targetId) {
        navigateToCollection(banner.targetId);
      }
      break;
    case 'external':
      if (banner.url) {
        Linking.openURL(banner.url);
      }
      break;
    default:
      // Fallback: try to open URL if available
      if (banner.url) {
        Linking.openURL(banner.url);
      } else if (banner.targetId) {
        // Try to infer type from targetId format or default to product
        navigateToProduct(banner.targetId);
      }
  }
}

// ============================================================================
// BRAND AND TAG DEEP LINKS
// ============================================================================

/**
 * Navigate to products by brand
 * @param brandId - Brand ID
 */
export function navigateToBrand(brandId: string): void {
  navigateToSearch({ brand: brandId });
}

/**
 * Navigate to products by tag
 * @param tag - Tag name
 */
export function navigateToTag(tag: string): void {
  navigateToSearch({ tag });
}

// ============================================================================
// ENTITY AUTO-DETECTION AND NAVIGATION
// ============================================================================

/**
 * Automatically navigate based on entity type
 * This function detects the type from the entity object and navigates accordingly
 * 
 * @param entity - Entity object (product, category, store, etc.)
 */
export function navigateToEntity(entity: {
  _id?: string;
  id?: string;
  type?: 'product' | 'category' | 'store' | 'collection';
  slug?: string;
  name?: string;
  [key: string]: any;
}): void {
  const entityId = entity._id || entity.id;
  if (!entityId) {
    console.warn('Entity has no ID:', entity);
    return;
  }

  // If type is explicitly provided, use it
  if (entity.type) {
    switch (entity.type) {
      case 'product':
        navigateToProduct(entityId, entity);
        return;
      case 'category':
        navigateToCategory(entityId, entity);
        return;
      case 'store':
        navigateToStore(entityId, entity);
        return;
      case 'collection':
        navigateToCollection(entityId, entity);
        return;
    }
  }

  // Auto-detect type based on entity structure
  // Product detection
  if (entity.price !== undefined || entity.images || entity.stock !== undefined) {
    navigateToProduct(entityId, entity);
    return;
  }

  // Store detection
  if (entity.businessName || entity.businessEmail || entity.merchant) {
    navigateToStore(entityId, entity);
    return;
  }

  // Category detection
  if (entity.name && (entity.children || entity.parent)) {
    navigateToCategory(entityId, entity);
    return;
  }

  // Default to product (most common)
  navigateToProduct(entityId, entity);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an entity is clickable (has navigation target)
 */
export function isClickable(entity: any): boolean {
  if (!entity) return false;
  
  // Has explicit type and targetId
  if (entity.type && entity.targetId) return true;
  
  // Has ID for navigation
  if (entity._id || entity.id) return true;
  
  // Banner with URL
  if (entity.url) return true;
  
  return false;
}

/**
 * Generate a deep link URL string (for sharing, analytics, etc.)
 */
export function generateDeepLinkUrl(entity: {
  type: 'product' | 'category' | 'store' | 'collection';
  id: string;
}): string {
  const baseUrl = 'nubian://'; // Replace with your actual deep link scheme
  return `${baseUrl}${entity.type}/${entity.id}`;
}
