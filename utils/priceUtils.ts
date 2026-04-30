// utils/priceUtils.ts
import { NormalizedProduct, ProductVariantDTO } from "@/domain/product/product.normalize";
import { resolvePrice, getDisplayPrice } from "@/domain/pricing/pricing.engine";
import { SelectedAttributes } from "@/domain/product/product.selectors";
import { findMatchingVariant, normalizeAttributes } from "@/utils/cartUtils";
import { useCurrencyStore } from "@/store/useCurrencyStore";

// ─── Typed Money envelope (matches backend currency.service.js) ──────────────

export type Money = {
  amount: number;
  currency: string;
  formatted?: string;
  decimals?: number;
  rate?: number;
  rateProvider?: string;
  rateDate?: string | null;
  rateUnavailable?: boolean;
};

export const isMoney = (v: unknown): v is Money =>
  !!v && typeof v === "object" && typeof (v as any).amount === "number" && typeof (v as any).currency === "string";

/**
 * Format a Money envelope or raw number using the user's selected currency.
 * NEVER converts. If you pass a raw number, it is assumed to already be in
 * the user's currency (matching the long-standing assumption of formatPrice).
 */
export function formatMoney(value: Money | number | null | undefined): string {
  if (value == null) return "";
  if (isMoney(value)) {
    if (value.formatted) return value.formatted;
    return formatRaw(value.amount, value.currency, value.decimals);
  }
  return useCurrencyStore.getState().formatPrice(Number(value) || 0);
}

function formatRaw(amount: number, code: string, decimals?: number): string {
  const cur = useCurrencyStore.getState().currencies.find((c) => c.code === code);
  const d = decimals ?? cur?.decimals ?? 2;
  const formatted = (Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
  if (!cur) return `${formatted} ${code}`; // honest fallback — code, not symbol
  return cur.symbolPosition === "after" ? `${formatted} ${cur.symbol}` : `${cur.symbol}${formatted}`;
}

/**
 * Pull the canonical `final` Money from a product (with optional variant).
 * Trusts the backend `price` envelope. Variants store the envelope under
 * `priceEnvelope` because `variant.price` is overloaded as a numeric mirror.
 * Returns null if no envelope is present (caller should fall back).
 */
export function getProductFinalMoney(
  product?: NormalizedProduct | null,
  selectedVariant?: ProductVariantDTO | null,
): Money | null {
  const fromVariant = (selectedVariant as any)?.priceEnvelope?.final;
  if (isMoney(fromVariant)) return fromVariant;
  const fromProduct = (product as any)?.price?.final;
  if (isMoney(fromProduct)) return fromProduct;
  return null;
}

export function getProductOriginalMoney(
  product?: NormalizedProduct | null,
  selectedVariant?: ProductVariantDTO | null,
): Money | null {
  const fromVariant = (selectedVariant as any)?.priceEnvelope?.original;
  if (isMoney(fromVariant)) return fromVariant;
  const fromProduct = (product as any)?.price?.original;
  if (isMoney(fromProduct)) return fromProduct;
  return null;
}

export interface PriceOptions {
  selectedAttributes?: SelectedAttributes;
  variant?: ProductVariantDTO | null;
  strategy?: "lowest" | "firstActive";
}

/**
 * Authoritative selling price
 */
export function getFinalPrice(product?: NormalizedProduct | null, options: PriceOptions = {}): number {
  if (!product) return 0;
  
  let selectedVariant = options.variant;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!selectedVariant && options.selectedAttributes && variants.length > 0) {
    const sel = normalizeAttributes(options.selectedAttributes);
    selectedVariant = findMatchingVariant(product as any, sel) as any;
  }

  const resolved = resolvePrice({ product, selectedVariant });
  return resolved.final;
}

/**
 * Authoritative original price (strike-through)
 */
export function getOriginalPrice(product?: NormalizedProduct | null, options: PriceOptions = {}): number {
  if (!product) return 0;

  let selectedVariant = options.variant;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (!selectedVariant && options.selectedAttributes && variants.length > 0) {
    const sel = normalizeAttributes(options.selectedAttributes);
    selectedVariant = findMatchingVariant(product as any, sel) as any;
  }

  const resolved = resolvePrice({ product, selectedVariant });
  return resolved.original ?? resolved.merchant;
}

export function hasDiscount(product?: NormalizedProduct | null, options: PriceOptions = {}): boolean {
  const current = getFinalPrice(product, options);
  const original = getOriginalPrice(product, options);
  return original > current;
}

export function getDiscountPercent(original: number, current: number): number {
  if (!original || original <= 0) return 0;
  if (!current || current <= 0) return 0;
  if (current >= original) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function formatPrice(amount: number) {
  return useCurrencyStore.getState().formatPrice(amount);
}

export { getDisplayPrice };
