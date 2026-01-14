// utils/priceUtils.ts
import type { SelectedAttributes } from "@/types/cart.types";
import { findMatchingVariant, normalizeAttributes } from "@/utils/cartUtils";

export type ProductVariant = {
  _id?: string;
  finalPrice?: number;
  merchantPrice?: number;
  price?: number;
  discountPrice?: number;
  stock?: number;
  isActive?: boolean;
  attributes?: Record<string, string> | Map<string, string>;
};

export type ProductLike = {
  _id?: string;
  finalPrice?: number;
  merchantPrice?: number;
  price?: number;
  discountPrice?: number;
  stock?: number;
  isActive?: boolean;
  variants?: ProductVariant[];
};

export type PriceStrategy = "lowest" | "firstActive";

export type PriceOptions = {
  selectedAttributes?: SelectedAttributes; // ✅ ATTRIBUTES only
  variant?: ProductVariant | null;

  strategy?: PriceStrategy; // ✅ B: أفضل واحد (default lowest)
  includeInactiveVariants?: boolean;
  includeOutOfStockVariants?: boolean;
  clampToZero?: boolean;
};

const DEFAULTS: Required<
  Pick<PriceOptions, "strategy" | "includeInactiveVariants" | "includeOutOfStockVariants" | "clampToZero">
> = {
  strategy: "lowest",
  includeInactiveVariants: false,
  includeOutOfStockVariants: false,
  clampToZero: true,
};

const safeNum = (v: any, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const clamp = (n: number, clampToZero: boolean) => (clampToZero ? Math.max(0, safeNum(n, 0)) : safeNum(n, 0));

function isEligibleVariant(v: ProductVariant, opts: typeof DEFAULTS) {
  const activeOk = opts.includeInactiveVariants ? true : v.isActive !== false;
  const stockOk = opts.includeOutOfStockVariants ? true : (v.stock ?? 0) > 0;
  return activeOk && stockOk;
}

/**
 * ✅ selling price (backend-first)
 * A: يعتمد على finalPrice من الباكند
 * - fallback فقط لو بيانات قديمة: discountPrice -> merchantPrice/price
 */
function resolveSellingPrice(obj: ProductLike | ProductVariant): number {
  const finalPrice = safeNum((obj as any).finalPrice, 0);
  if (finalPrice > 0) return finalPrice;

  // legacy fallback only
  const discountPrice = safeNum((obj as any).discountPrice, 0);
  if (discountPrice > 0) return discountPrice;

  return safeNum((obj as any).merchantPrice, safeNum((obj as any).price, 0));
}

/**
 * ✅ compare-at/original price (strike-through)
 * المرجع: merchantPrice (أو price كـ legacy)
 */
function resolveOriginalPrice(obj: ProductLike | ProductVariant): number {
  return safeNum((obj as any).merchantPrice, safeNum((obj as any).price, 0));
}

/** ✅ final selling price */
export function getFinalPrice(product?: ProductLike | null, options: PriceOptions = {}): number {
  const opts = { ...DEFAULTS, ...(options ?? {}) };
  if (!product) return 0;

  const variants = Array.isArray(product.variants) ? product.variants : [];

  // 1) direct variant passed (explicit)
  if (options.variant) {
    return clamp(resolveSellingPrice(options.variant), opts.clampToZero);
  }

  // 2) selectedAttributes -> match variant (ATTRIBUTES only)
  if (options.selectedAttributes && variants.length) {
    const sel = normalizeAttributes(options.selectedAttributes);
    const v = findMatchingVariant(product as any, sel) as any;
    if (v) return clamp(resolveSellingPrice(v), opts.clampToZero);
  }

  // 3) no selection -> pick best variant based on strategy
  if (variants.length) {
    const poolEligible = variants.filter((v) => isEligibleVariant(v, opts));
    const pool = poolEligible.length ? poolEligible : variants;

    if (opts.strategy === "firstActive") {
      // أول variant active (ولو مافي، أول واحد وخلاص)
      const first = pool.find((v) => v.isActive !== false) ?? pool[0];
      return clamp(resolveSellingPrice(first as ProductVariant), opts.clampToZero);
    }

    // default: "lowest" => أقل finalPrice eligible
    let best = Infinity;
    for (const v of pool) {
      const val = safeNum((v as any).finalPrice, Infinity);
      if (val > 0 && val < best) best = val;
    }
    if (best !== Infinity) return clamp(best, opts.clampToZero);

    // fallback لو finalPrice مش موجودة إطلاقاً
    let bestFallback = Infinity;
    for (const v of pool) {
      const val = resolveSellingPrice(v);
      if (val > 0 && val < bestFallback) bestFallback = val;
    }
    return clamp(bestFallback === Infinity ? 0 : bestFallback, opts.clampToZero);
  }

  // 4) simple product
  return clamp(resolveSellingPrice(product), opts.clampToZero);
}

/** ✅ original price for strike-through */
export function getOriginalPrice(product?: ProductLike | null, options: PriceOptions = {}): number {
  const opts = { ...DEFAULTS, ...(options ?? {}) };
  if (!product) return 0;

  const current = getFinalPrice(product, options);
  const variants = Array.isArray(product.variants) ? product.variants : [];

  let original = 0;

  if (options.variant) {
    original = resolveOriginalPrice(options.variant);
  } else if (options.selectedAttributes && variants.length) {
    const v = findMatchingVariant(product as any, normalizeAttributes(options.selectedAttributes)) as any;
    original = v ? resolveOriginalPrice(v) : 0;
  } else if (variants.length) {
    // خت strike-through بناءً على نفس variant اللي بنعرض سعره
    if (opts.strategy === "firstActive") {
      const first = variants.find((v) => v.isActive !== false) ?? variants[0];
      original = resolveOriginalPrice(first as ProductLike | ProductVariant as any);
    } else {
      // lowest: original لِـ variant الأقل finalPrice
      let bestV: any = null;
      let best = Infinity;
      for (const v of variants) {
        const fp = safeNum((v as any).finalPrice, Infinity);
        if (fp > 0 && fp < best) {
          best = fp;
          bestV = v;
        }
      }
      original = bestV ? resolveOriginalPrice(bestV as ProductLike | ProductVariant) : 0;
    }
  } else {
    original = resolveOriginalPrice(product as ProductLike | ProductVariant as any);
  }

  if (!original || original <= 0) return clamp(current, opts.clampToZero);
  return clamp(Math.max(original, current), opts.clampToZero);
}

export function hasDiscount(product?: ProductLike | null, options: PriceOptions = {}): boolean {
  const current = getFinalPrice(product, options);
  const original = getOriginalPrice(product, options);
  return original > current;
}

export function formatPrice(amount: number, currency: string = "SDG") {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${n.toFixed(0)} ${currency}`;
}
