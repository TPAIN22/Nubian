import { getHomeData, HomeData, HomeProduct, HomeCategory, HomeBanner, HomeCollection, HomeStore } from "../api/home.api";
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

  /**
   * Collections that can actually be rendered and tapped.
   *
   * Unlike `filterActiveCategories`, this does NOT require an image: a
   * collection is created by an admin who may reasonably leave the cover blank,
   * and dropping it here would make it silently vanish from the home screen
   * with nothing in the dashboard to explain why. The card falls back to a
   * tinted tile instead. An entry with no id or no name is unusable, so those
   * are dropped.
   *
   * A collection whose products are all unavailable is left in: the API still
   * serves it, and its screen has a proper empty state.
   */
  static filterActiveCollections(collections: HomeCollection[]): HomeCollection[] {
    if (!Array.isArray(collections)) return [];
    return collections.filter((c) => !!c && !!c._id && !!String(c.name || "").trim());
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
