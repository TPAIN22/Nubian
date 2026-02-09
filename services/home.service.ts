import { getHomeData, HomeData, HomeProduct, HomeCategory, HomeBanner, HomeStore } from "../api/home.api";
import { hasAnyActiveStock } from "@/utils/cartUtils";
import { getDiscountPercent, getFinalPrice, getOriginalPrice } from "@/utils/priceUtils";

export class HomeService {
  static async fetchHomeData(currencyCode?: string): Promise<HomeData> {
    return getHomeData(currencyCode);
  }

  /** ✅ هل المنتج عنده variants؟ */
  static hasVariants(product: HomeProduct): boolean {
    return Array.isArray((product as any).variants) && (product as any).variants.length > 0;
  }

  /** ✅ stock الحقيقي: availability without attribute selection */
  static hasStock(product: HomeProduct): boolean {
    return hasAnyActiveStock(product as any);
  }

  /** ✅ Filter products by availability (stock + active + merchant approved) */
  static filterAvailableProducts(products: HomeProduct[]): HomeProduct[] {
    if (!Array.isArray(products) || products.length === 0) return [];

    return products
      .filter((product) => {
        const p: any = product;

        // merchant gate
        if (p.merchant && p.merchant.status && p.merchant.status !== "APPROVED") return false;

        // product active + stock
        return this.hasStock(product);
      })
      .map((product) => {
        // ✅ enrich without mutating original
        const finalPrice = getFinalPrice(product as any, { strategy: "lowest" });
        const originalPrice = getOriginalPrice(product as any, { strategy: "lowest" });
        const discount = getDiscountPercent(originalPrice, finalPrice);

        return {
          ...product,
          hasStock: this.hasStock(product),
          finalPrice,
          // keep discountPrice as compare-at (old price) as-is, don't overwrite
          discount,
        } as HomeProduct;
      });
  }

  static filterActiveCategories(categories: HomeCategory[]): HomeCategory[] {
    return Array.isArray(categories) ? categories.filter((cat) => !!cat.image) : [];
  }

  static filterActiveBanners(banners: HomeBanner[]): HomeBanner[] {
    return Array.isArray(banners) ? banners.filter((banner) => !!banner.image) : [];
  }

  static filterVerifiedStores(stores: HomeStore[]): HomeStore[] {
    return Array.isArray(stores) ? stores.filter((store) => !!store.verified) : [];
  }

  static isFlashDeal(product: HomeProduct): boolean {
    const p: any = product;
    return (p.discount ?? 0) > 0 && (p.hasStock ?? this.hasStock(product));
  }

  static sortByDiscount(products: HomeProduct[]): HomeProduct[] {
    return [...products].sort((a: any, b: any) => (b.discount ?? 0) - (a.discount ?? 0));
  }

  static sortByRating(products: HomeProduct[]): HomeProduct[] {
    return [...products].sort((a: any, b: any) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
  }

  static sortByNewest(products: HomeProduct[]): HomeProduct[] {
    return [...products].sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }
}
