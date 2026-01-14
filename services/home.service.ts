import { getHomeData, HomeData, HomeProduct, HomeCategory, HomeBanner, HomeStore } from "../api/home.api";

type VariantLike = {
  stock?: number;
  isActive?: boolean;
  finalPrice?: number;
  merchantPrice?: number;
  price?: number;
  discountPrice?: number; // compare-at
};

export class HomeService {
  static async fetchHomeData(): Promise<HomeData> {
    return getHomeData();
  }

  /** ✅ هل المنتج عنده variants؟ */
  static hasVariants(product: HomeProduct): boolean {
    return Array.isArray((product as any).variants) && (product as any).variants.length > 0;
  }

  /** ✅ stock الحقيقي: لو في variants = مجموع/أو وجود ستوك في أي variant active */
  static hasStock(product: HomeProduct): boolean {
    const p: any = product;

    // product inactive => not available
    if (p.isActive === false) return false;

    // variant-based
    if (this.hasVariants(product)) {
      return (p.variants as VariantLike[]).some((v) => (v?.isActive !== false) && ((v?.stock ?? 0) > 0));
    }

    // simple
    return (p.stock ?? 0) > 0;
  }

  /** ✅ final selling price: variant? product? */
  
  static getFinalPrice(product: HomeProduct): number {
    const p: any = product;
  
    // variant-based products: show the lowest dynamic finalPrice among active + in-stock variants
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      const eligible = p.variants.filter(
        (v: any) => v?.isActive !== false && (v?.stock ?? 0) > 0
      );
  
      const list = eligible.length ? eligible : p.variants.filter((v: any) => v?.isActive !== false);
  
      let best = Infinity;
      for (const v of list) {
        // ✅ dynamic pricing first
        const val = v?.finalPrice ?? v?.merchantPrice ?? v?.price ?? 0;
        if (val > 0 && val < best) best = val;
      }
      return Number.isFinite(best) && best !== Infinity ? best : 0;
    }
  
    // simple product: show dynamic finalPrice directly
    return p.finalPrice ?? p.merchantPrice ?? p.price ?? 0;
  }  

  /** ✅ original/compare-at price (old price) */
  static getOriginalPrice(product: HomeProduct): number {
    const p: any = product;
  
    // simple product
    const current = this.getFinalPrice(product);
    const old = p.discountPrice ?? 0;
    return old > 0 ? Math.max(old, current) : current;
  }

  /** ✅ discount % */
  static calculateDiscountFromPrices(original: number, current: number): number {
    if (!original || original <= 0) return 0;
    if (!current || current <= 0) return 0;
    if (current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
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
        const p: any = product;
        const finalPrice = this.getFinalPrice(product);
        const originalPrice = this.getOriginalPrice(product);
        const discount = this.calculateDiscountFromPrices(originalPrice, finalPrice);

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
