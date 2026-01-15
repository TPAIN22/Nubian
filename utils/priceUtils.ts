// utils/priceUtils.ts
import { NormalizedProduct, ProductVariantDTO } from "@/domain/product/product.normalize";
import { resolvePrice, getDisplayPrice } from "@/domain/pricing/pricing.engine";
import { SelectedAttributes } from "@/domain/product/product.selectors";
import { findMatchingVariant, normalizeAttributes } from "@/utils/cartUtils";

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

export function formatPrice(amount: number, currency: string = "SDG") {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${n.toFixed(0)} ${currency}`;
}

export { getDisplayPrice };
