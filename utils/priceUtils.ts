// utils/priceUtils.ts
import type { SelectedAttributes } from "@/types/cart.types";
import { findMatchingVariant } from "@/utils/cartUtils";

/** Strategy for picking which variant's price to show */
export type PricePickStrategy =
  | "direct"
  | "selectedAttributes"
  | "firstActive"
  | "lowest"
  | "highest";

export type ProductVariant = {
  _id?: string;

  // smart
  merchantPrice?: number;
  finalPrice?: number;

  // legacy
  price?: number;
  discountPrice?: number;

  stock?: number;
  isActive?: boolean;

  attributes?: Record<string, string> | Map<string, string>;
};

export type ProductLike = {
  _id?: string;

  // smart
  merchantPrice?: number;
  finalPrice?: number;

  // legacy
  price?: number;
  discountPrice?: number;

  stock?: number;

  variants?: ProductVariant[];
};

export type PriceOptions = {
  strategy?: PricePickStrategy;

  /** resolve by selected attributes (Details screen) */
  selectedAttributes?: SelectedAttributes;

  /** pass resolved variant directly */
  variant?: ProductVariant | null;

  includeInactiveVariants?: boolean;
  includeOutOfStockVariants?: boolean;
  clampToZero?: boolean;
};

const DEFAULTS = {
  // ✅ أفضل default لتفادي فلاش/سعر غلط لما ما في selectedAttributes
  strategy: "firstActive" as PricePickStrategy,
  includeInactiveVariants: false,
  includeOutOfStockVariants: false,
  clampToZero: true,
};

function clamp(n: number, clampToZero: boolean) {
  if (!Number.isFinite(n)) return clampToZero ? 0 : n;
  return clampToZero ? Math.max(0, n) : n;
}

function basePriceFromVariant(v: ProductVariant): number {
  return v.finalPrice ?? v.merchantPrice ?? v.price ?? 0;
}

function basePriceFromProduct(p: ProductLike): number {
  return p.finalPrice ?? p.merchantPrice ?? p.price ?? 0;
}

function isEligibleVariant(v: ProductVariant, opts: typeof DEFAULTS) {
  const activeOk = opts.includeInactiveVariants ? true : v.isActive !== false;
  const stockOk = opts.includeOutOfStockVariants ? true : (v.stock ?? 0) > 0;
  return activeOk && stockOk;
}

function pickVariant(product: ProductLike, options?: PriceOptions): ProductVariant | null {
  const opts = { ...DEFAULTS, ...(options ?? {}) };
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!variants.length) return null;

  // 1) direct
  if (options?.variant) return options.variant;

  // 2) selectedAttributes
  if (options?.strategy === "selectedAttributes" && options?.selectedAttributes) {
    const v = findMatchingVariant(product as any, options.selectedAttributes as any) as any;
    return v ?? null;
  }

  // 3) eligible list
  const eligible = variants.filter((v) => isEligibleVariant(v, opts));
  const list = eligible.length ? eligible : variants;

  if ((options?.strategy ?? opts.strategy) === "firstActive") {
    return list.find((v) => v.isActive !== false) ?? list[0] ?? null;
  }

  if ((options?.strategy ?? opts.strategy) === "highest") {
    let best: ProductVariant | null = null;
    let bestVal = -Infinity;
    for (const v of list) {
      const val = basePriceFromVariant(v);
      if (val > bestVal) {
        bestVal = val;
        best = v;
      }
    }
    return best ?? list[0] ?? null;
  }

  if ((options?.strategy ?? opts.strategy) === "lowest") {
    let best: ProductVariant | null = null;
    let bestVal = Infinity;
    for (const v of list) {
      const val = basePriceFromVariant(v);
      if (val > 0 && val < bestVal) {
        bestVal = val;
        best = v;
      }
    }
    return best ?? list[0] ?? null;
  }

  // default fallback
  return list[0] ?? null;
}

/** ✅ final selling price */
export function getFinalPrice(product?: ProductLike | null, options: PriceOptions = {}): number {
  const opts = { ...DEFAULTS, ...(options ?? {}) };
  if (!product) return 0;

  // لو المستخدم مرسل selectedAttributes → استخدمها
  const strategy =
    options.strategy ??
    (options.selectedAttributes ? "selectedAttributes" : DEFAULTS.strategy);

  const v = pickVariant(product, { ...options, strategy });
  const value = v ? basePriceFromVariant(v) : basePriceFromProduct(product);

  return clamp(value, opts.clampToZero);
}

/** ✅ original/compare-at price (legacy discountPrice treated as old price) */
export function getOriginalPrice(product?: ProductLike | null, options: PriceOptions = {}): number {
  const opts = { ...DEFAULTS, ...(options ?? {}) };
  if (!product) return 0;

  const current = getFinalPrice(product, options);

  const strategy =
    options.strategy ??
    (options.selectedAttributes ? "selectedAttributes" : DEFAULTS.strategy);

  const v = pickVariant(product, { ...options, strategy });
  const originalRaw = v ? (v.discountPrice ?? 0) : (product.discountPrice ?? 0);

  if (!originalRaw || originalRaw <= 0) return clamp(current, opts.clampToZero);

  return clamp(Math.max(originalRaw, current), opts.clampToZero);
}

export function hasDiscount(product?: ProductLike | null, options: PriceOptions = {}): boolean {
  const current = getFinalPrice(product, options);
  const original = getOriginalPrice(product, options);
  return original > current;
}

export function calculateDiscountPercentage(original: number, current: number): number {
  if (!original || original <= 0) return 0;
  if (!current || current <= 0) return 0;
  if (current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function formatPrice(amount: number, currency: string = "SDG") {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${n.toFixed(0)} ${currency}`;
}
