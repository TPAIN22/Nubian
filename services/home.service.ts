import { getHomeData, HomeData, HomeProduct, HomeCategory, HomeBanner, HomeStore } from "../api/home.api";
import { hasAnyActiveStock } from "@/utils/cartUtils";

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

  /** ✅ Filter products by availability (stock + active + merchant approved).
   *  Trusts backend-converted prices — no client-side re-derivation of money
   *  fields (which used to overwrite the converted finalPrice with whatever
   *  the legacy fallback chain picked, occasionally leaking USD numbers). */
  static filterAvailableProducts(products: HomeProduct[]): HomeProduct[] {
    if (!Array.isArray(products) || products.length === 0) return [];

    return products
      .filter((product) => {
        const p: any = product;
        if (p.merchant && p.merchant.status && p.merchant.status !== "APPROVED") return false;
        return this.hasStock(product);
      })
      .map((product) => ({
        ...product,
        hasStock: this.hasStock(product),
      } as HomeProduct));
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
    const pct = p.price?.discountPercentage ?? p.discountPercentage ?? p.displayDiscountPercentage ?? 0;
    return pct > 0 && (p.hasStock ?? this.hasStock(product));
  }

  static sortByDiscount(products: HomeProduct[]): HomeProduct[] {
    const pct = (p: any) =>
      p.price?.discountPercentage ?? p.discountPercentage ?? p.displayDiscountPercentage ?? 0;
    return [...products].sort((a, b) => pct(b) - pct(a));
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
