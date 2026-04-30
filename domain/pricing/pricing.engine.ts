import { NormalizedProduct, ProductVariantDTO } from "../product/product.normalize";
import { ResolvedPrice, PricingOptions } from "./pricing.types";

/**
 * Authoritative pricing resolver for the mobile app.
 *
 * The backend (lib/pricing.engine.js → enrichProductWithPricing) is the source
 * of truth: it writes finalPrice / originalPrice / discountAmount /
 * discountPercentage / hasDiscount onto the product root AND every variant.
 * This function trusts those fields. We only fall back to local math when the
 * payload comes from a legacy endpoint that didn't enrich.
 */
export function resolvePrice({
  product,
  selectedVariant,
  currency = "USD",
}: PricingOptions): ResolvedPrice {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;

  if (hasVariants) {
    if (!selectedVariant) {
      return resolveFromPrice(product, variants, currency);
    }
    return resolveVariant(selectedVariant, currency);
  }

  return resolveSimple(product, currency);
}

// ── Variant product, no variant selected (listing card "From X") ────────────
function resolveFromPrice(
  product: NormalizedProduct,
  variants: ProductVariantDTO[],
  currency: string,
): ResolvedPrice {
  // Prefer the converted root finalPrice. Backend convertProductPrices updates
  // root finalPrice/originalPrice (and on normalized products, productLevelPricing
  // mirrors them), but the display* aliases were historically left in USD — so
  // reading the alias first gave stale numbers on currency-converted payloads.
  const plp = product.productLevelPricing ?? {};
  const rootFinal =
    (product as any).finalPrice ??
    plp.finalPrice ??
    product.displayFinalPrice;

  if (rootFinal !== undefined && rootFinal > 0) {
    const final = rootFinal;
    const original =
      product.originalPrice ??
      product.displayOriginalPrice ??
      final;
    return withDiscount({
      final,
      merchant: plp.merchantPrice ?? final,
      original,
      currency,
      source: "definitive",
      requiresSelection: true,
      backendDiscount: {
        amount: Math.max(0, original - final),
        percentage:
          product.discountPercentage ??
          product.displayDiscountPercentage,
      },
    });
  }

  // 2. Otherwise look at the cheapest variant (each variant carries its own
  //    enriched pricing block).
  const priced = variants
    .filter((v) => v.isActive !== false)
    .map((v) => resolveVariant(v, currency))
    .filter((p) => p.final > 0)
    .sort((a, b) => a.final - b.final);

  const cheapest = priced[0];
  if (cheapest) {
    return { ...cheapest, requiresSelection: true };
  }

  // 3. Final legacy fallback — productLevelPricing only.
  return localFallback({
    merchant: plp.merchantPrice ?? 0,
    nubianMarkup: plp.nubianMarkup ?? 30,
    dynamicMarkup: plp.dynamicMarkup ?? 0,
    legacyDiscountPrice: plp.discountPrice ?? undefined,
    storedFinalPrice: plp.finalPrice ?? undefined,
    currency,
    source: "variant",
    requiresSelection: true,
  });
}

// ── Variant product, variant selected ────────────────────────────────────────
function resolveVariant(variant: ProductVariantDTO, currency = "USD"): ResolvedPrice {
  const merchant = variant.merchantPrice ?? variant.basePrice ?? 0;

  if (variant.finalPrice !== undefined && variant.finalPrice > 0) {
    const final = variant.finalPrice;
    const original = variant.originalPrice ?? variant.listPrice ?? final;
    return withDiscount({
      final,
      merchant,
      original,
      currency,
      source: "variant",
      backendDiscount: {
        amount: variant.discountAmount,
        percentage: variant.discountPercentage,
      },
      breakdown: {
        merchantPrice: merchant,
        nubianMarkup: variant.nubianMarkup ?? 30,
        dynamicMarkup: variant.dynamicMarkup ?? 0,
        finalPrice: final,
      },
    });
  }

  return localFallback({
    merchant,
    nubianMarkup: variant.nubianMarkup ?? 30,
    dynamicMarkup: variant.dynamicMarkup ?? 0,
    legacyDiscountPrice: variant.discountPrice,
    storedFinalPrice: variant.finalPrice,
    currency,
    source: "variant",
    requiresSelection: false,
  });
}

// ── Simple product (no variants) ─────────────────────────────────────────────
function resolveSimple(product: NormalizedProduct, currency = "USD"): ResolvedPrice {
  const simple = product.simple ?? ({} as NormalizedProduct["simple"]);
  const merchant = simple.merchantPrice ?? 0;

  // See resolveFromPrice for the priority rationale — converted root values win
  // over the un-converted display* aliases.
  const rootFinal =
    (product as any).finalPrice ??
    simple.finalPrice ??
    product.displayFinalPrice;

  if (rootFinal !== undefined && rootFinal > 0) {
    const final = rootFinal;
    const original =
      product.originalPrice ??
      product.displayOriginalPrice ??
      final;
    return withDiscount({
      final,
      merchant,
      original,
      currency,
      source: "simple",
      backendDiscount: {
        amount: Math.max(0, original - final),
        percentage:
          product.discountPercentage ??
          product.displayDiscountPercentage,
      },
    });
  }

  return localFallback({
    merchant,
    nubianMarkup: simple.nubianMarkup ?? 30,
    dynamicMarkup: simple.dynamicMarkup ?? 0,
    legacyDiscountPrice: simple.discountPrice ?? undefined,
    storedFinalPrice: simple.finalPrice ?? undefined,
    currency,
    source: "simple",
    requiresSelection: false,
  });
}

/**
 * Helper to get the "From" price for list displays.
 * Prefers backend's displayFinalPrice, then variant min, then merchantPrice.
 */
export function getDisplayPrice(product: NormalizedProduct): { price: number; isFrom: boolean } {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;

  if (hasVariants) {
    const plp = product.productLevelPricing ?? {};
    // Trust converted root finalPrice over the un-converted displayFinalPrice alias.
    let price =
      (product as any).finalPrice ??
      plp.finalPrice ??
      product.displayFinalPrice ??
      0;
    if (price <= 0) price = plp.merchantPrice ?? 0;

    if (price <= 0) {
      const variantPrices = variants
        .filter((v) => v.isActive !== false)
        .map((v) => v.finalPrice ?? v.merchantPrice ?? v.price ?? 0)
        .filter((p) => p > 0);
      if (variantPrices.length > 0) price = Math.min(...variantPrices);
    }

    return { price, isFrom: true };
  }

  const simple = product.simple ?? ({} as NormalizedProduct["simple"]);
  let price =
    (product as any).finalPrice ??
    simple.finalPrice ??
    product.displayFinalPrice ??
    0;
  if (price <= 0) price = simple.merchantPrice ?? 0;
  return { price, isFrom: false };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function withDiscount(args: {
  final: number;
  merchant: number;
  original: number;
  currency: string;
  source: ResolvedPrice["source"];
  requiresSelection?: boolean;
  backendDiscount?: { amount?: number; percentage?: number };
  breakdown?: ResolvedPrice["breakdown"];
}): ResolvedPrice {
  const { final, merchant, original, currency, source, requiresSelection, backendDiscount, breakdown } = args;

  const amount =
    backendDiscount?.amount !== undefined && backendDiscount.amount > 0
      ? backendDiscount.amount
      : Math.max(0, original - final);

  const percentage =
    backendDiscount?.percentage !== undefined && backendDiscount.percentage > 0
      ? backendDiscount.percentage
      : original > 0 && amount > 0
        ? Math.round((amount / original) * 100)
        : 0;

  return {
    final,
    merchant,
    original,
    currency,
    source,
    requiresSelection: requiresSelection ?? false,
    discount: amount > 0 ? { amount, percentage } : undefined,
    breakdown,
  };
}

function localFallback(args: {
  merchant: number;
  nubianMarkup: number;
  dynamicMarkup: number;
  legacyDiscountPrice?: number;
  storedFinalPrice?: number;
  currency: string;
  source: ResolvedPrice["source"];
  requiresSelection: boolean;
}): ResolvedPrice {
  const { merchant, nubianMarkup, dynamicMarkup, legacyDiscountPrice, storedFinalPrice, currency, source, requiresSelection } = args;

  const listed = round2(merchant * (1 + nubianMarkup / 100));
  const surged = round2(merchant * (1 + nubianMarkup / 100 + dynamicMarkup / 100));
  let final = storedFinalPrice && storedFinalPrice > 0 ? storedFinalPrice : surged;

  if (legacyDiscountPrice && legacyDiscountPrice > 0 && legacyDiscountPrice < final) {
    final = legacyDiscountPrice;
  }

  const original = Math.max(listed, surged);
  const amount = Math.max(0, original - final);
  const percentage = original > 0 && amount > 0 ? Math.round((amount / original) * 100) : 0;

  return {
    final,
    merchant,
    original,
    currency,
    source,
    requiresSelection,
    discount: amount > 0 ? { amount, percentage } : undefined,
    breakdown: { merchantPrice: merchant, nubianMarkup, dynamicMarkup, finalPrice: final },
  };
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
