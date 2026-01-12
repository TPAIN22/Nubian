import { getHomeData, HomeData, HomeProduct, HomeCategory, HomeBanner, HomeStore } from '../api/home.api';

/**
 * Home Service - Business logic layer for home screen data
 */
export class HomeService {
  /**
   * Get all home screen data
   */
  static async fetchHomeData(): Promise<HomeData> {
    return getHomeData();
  }

  /**
   * Filter products by availability
   * Respects: stock, isActive, merchant status
   */
  static filterAvailableProducts(products: HomeProduct[]): HomeProduct[] {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    return products.filter(product => {
      // Check merchant status first (if product has merchant)
      if (product.merchant && product.merchant.status !== 'APPROVED') {
        return false;
      }

      // Check if product has stock (main or variant)
      const hasMainStock = (product.stock || 0) > 0;
      const hasVariantStock = product.variants?.some(
        v => (v.stock || 0) > 0 && v.isActive !== false
      ) || false;

      return hasMainStock || hasVariantStock;
    }).map(product => {
      // Enrich products with missing fields if needed (for recommendations API)
      if (product.hasStock === undefined) {
        product.hasStock = product.stock > 0 || (product.variants?.some(
          v => v.stock > 0 && v.isActive !== false
        ) || false);
      }
      if (product.finalPrice === undefined) {
        product.finalPrice = this.getFinalPrice(product);
      }
      if (product.discount === undefined) {
        const price = product.price || 0;
        const discountPrice = product.discountPrice || 0;
        product.discount = discountPrice > 0 && price > discountPrice
          ? Math.round(((price - discountPrice) / price) * 100)
          : 0;
      }
      return product;
    });
  }

  /**
   * Get active categories only
   */
  static filterActiveCategories(categories: HomeCategory[]): HomeCategory[] {
    return categories.filter(cat => cat.image); // Only categories with images
  }

  /**
   * Get active banners only
   */
  static filterActiveBanners(banners: HomeBanner[]): HomeBanner[] {
    return banners.filter(banner => banner.image);
  }

  /**
   * Get verified stores only
   */
  static filterVerifiedStores(stores: HomeStore[]): HomeStore[] {
    return stores.filter(store => store.verified);
  }

  /**
   * Calculate discount percentage
   */
  static calculateDiscount(price: number, discountPrice: number): number {
    if (!discountPrice || discountPrice >= price || price === 0) {
      return 0;
    }
    return Math.round(((price - discountPrice) / price) * 100);
  }

  /**
   * Get final price (discount price if available, otherwise regular price)
   */
  static getFinalPrice(product: HomeProduct): number {
    if (product.discountPrice > 0 && product.discountPrice < product.price) {
      return product.discountPrice;
    }
    return product.price;
  }

  /**
   * Check if product is in flash deal
   */
  static isFlashDeal(product: HomeProduct): boolean {
    return product.discount > 0 && product.hasStock;
  }

  /**
   * Sort products by discount percentage (highest first)
   */
  static sortByDiscount(products: HomeProduct[]): HomeProduct[] {
    return [...products].sort((a, b) => b.discount - a.discount);
  }

  /**
   * Sort products by rating (highest first)
   */
  static sortByRating(products: HomeProduct[]): HomeProduct[] {
    return [...products].sort((a, b) => b.averageRating - a.averageRating);
  }

  /**
   * Sort products by newest (createdAt)
   */
  static sortByNewest(products: HomeProduct[]): HomeProduct[] {
    // Assuming products have createdAt field
    return [...products].sort((a, b) => {
      const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}
