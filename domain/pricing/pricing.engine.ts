import { NormalizedProduct } from "../product/product.normalize";
import { ResolvedPrice, PricingOptions } from "./pricing.types";

/**
 * Authoritative pricing resolver for the mobile app.
 * 
 * Rules:
 * 1. If product has variants:
 *    - If no variant selected -> requiresSelection = true
 *    - If variant selected -> use variant-level pricing
 * 2. If product has NO variants:
 *    - Use product.simple fields
 * 3. NEVER use productLevelPricing for final totals (only for "From" display)
 */
export function resolvePrice({
  product,
  selectedVariant,
  currency = "USD",
}: PricingOptions): ResolvedPrice {
  // Safe access with fallbacks for non-normalized products
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const productLevelPricing = product?.productLevelPricing || {};
  const simple = product?.simple || {};

  // PRIORITY: If backend provided definitive display pricing and no variant is selected (or product is simple), use it.
  // This ensures consistency with the backend calculations (sanity checks etc).
  if (!selectedVariant && product?.displayFinalPrice !== undefined) {
      const final = product.displayFinalPrice;
      const original = product.displayOriginalPrice ?? final;
      const discountAmount = Math.max(0, original - final);

      return {
          final,
          merchant: product.merchantId ? (product.productLevelPricing?.merchantPrice || 0) : 0, // approximate
          original,
          currency,
          requiresSelection: hasVariants, // If it has variants but none selected, it might still require selection
          source: "definitive",
          discount: (product.displayDiscountPercentage && product.displayDiscountPercentage > 0) 
              ? { amount: discountAmount, percentage: product.displayDiscountPercentage } // amount is derivative, percentage is source of truth
              : undefined,
      };
  }

  // Case 1: Variant Product
  if (hasVariants) {
    if (!selectedVariant) {
      // Get "From" price from productLevelPricing as a fallback for display
      const final = productLevelPricing.finalPrice ?? 0;
      const merchant = productLevelPricing.merchantPrice ?? 0;
      const nubianMarkup = productLevelPricing.nubianMarkup ?? 10;

      // The "normal" price is the merchant price plus the fixed Nubian markup
      const normalPrice = merchant * (1 + nubianMarkup / 100);

      let original = normalPrice;

      if (productLevelPricing.discountPrice && productLevelPricing.discountPrice > 0) {
        original = normalPrice;
      } else if (normalPrice > final) {
        original = normalPrice;
      } else {
        original = final;
      }

      const discountAmount = Math.max(0, original - final);
      const discountPercentage = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

      return {
        final,
        merchant,
        original,
        currency,
        requiresSelection: true,
        source: "variant",
        discount: discountAmount > 0 ? { amount: discountAmount, percentage: discountPercentage } : undefined,
      };
    }

    // Selected variant exists
    let final = selectedVariant.finalPrice ?? selectedVariant.merchantPrice ?? 0;
    
    // FALLBACK: If final/merchant are 0, try the legacy "price" field
    if (final <= 0) {
        final = selectedVariant.price ?? 0;
    }

    const merchant = selectedVariant.merchantPrice ?? 0;
    const nubianMarkup = selectedVariant.nubianMarkup ?? 10;
    
    // The "normal" price is the merchant price plus the fixed Nubian markup
    let normalPrice = merchant * (1 + nubianMarkup / 100);
    if (normalPrice <= 0) normalPrice = final; // fallback
    
    let original = normalPrice;
    
    if (selectedVariant.discountPrice && selectedVariant.discountPrice > 0) {
      // If there's a manual discount override, the "original" was the intended final price with markups
      original = normalPrice;
    } else if (normalPrice > final) {
      // If normal price is higher than current final (e.g. negative dynamic markup), normal is original
      original = normalPrice;
    } else {
      // Otherwise, no discount to show (original = final)
      original = final;
    }

    const discountAmount = Math.max(0, original - final);
    const discountPercentage = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

    return {
      final,
      merchant,
      original,
      currency,
      requiresSelection: false,
      source: "variant",
      discount: discountAmount > 0 ? { amount: discountAmount, percentage: discountPercentage } : undefined,
      breakdown: {
        merchantPrice: selectedVariant.merchantPrice ?? 0,
        nubianMarkup: selectedVariant.nubianMarkup ?? 0,
        dynamicMarkup: selectedVariant.dynamicMarkup ?? 0,
        finalPrice: selectedVariant.finalPrice ?? 0,
      },
    };
  }

  // Case 2: Simple Product
  const final = simple.finalPrice ?? simple.merchantPrice ?? 0;
  const merchant = simple.merchantPrice ?? 0;
  const nubianMarkup = simple.nubianMarkup ?? 10;
  
  // The "normal" price is the merchant price plus the fixed Nubian markup
  const normalPrice = merchant * (1 + nubianMarkup / 100);
  
  let original = normalPrice;
  
  if (simple.discountPrice && simple.discountPrice > 0) {
    // If there's a discount, the "original" is the normal calculated price (MSRP)
    original = normalPrice;
  } else if (normalPrice > final) {
    original = normalPrice;
  } else {
    original = final;
  }

  const discountAmount = Math.max(0, original - final);
  const discountPercentage = original > 0 ? Math.round((discountAmount / original) * 100) : 0;

  return {
    final,
    merchant,
    original,
    currency,
    requiresSelection: false,
    source: "simple",
    discount: discountAmount > 0 ? { amount: discountAmount, percentage: discountPercentage } : undefined,
    breakdown: simple.finalPrice !== null ? {
      merchantPrice: simple.merchantPrice ?? 0,
      nubianMarkup: simple.nubianMarkup ?? 0,
      dynamicMarkup: simple.dynamicMarkup ?? 0,
      finalPrice: simple.finalPrice ?? 0,
    } : undefined,
  };
}

/**
 * Helper to get the "From" price for list displays
 */
export function getDisplayPrice(product: NormalizedProduct): { price: number; isFrom: boolean } {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const productLevelPricing = product?.productLevelPricing || {};
  const simple = product?.simple || {};
  
  if (hasVariants) {
    // Priority: calculated finalPrice > merchantPrice > minimum variant price
    let price = productLevelPricing.finalPrice ?? 0;
    if (price <= 0) price = productLevelPricing.merchantPrice ?? 0;
    
    // If still 0, try to find the minimum from variants directly
    if (price <= 0 && variants.length > 0) {
      const variantPrices = variants
        .map(v => {
            let p = v.finalPrice ?? v.merchantPrice ?? 0;
            if (p <= 0) p = v.price ?? 0;
            return p;
        })
        .filter(p => p > 0);
      if (variantPrices.length > 0) price = Math.min(...variantPrices);
    }

    return {
      price,
      isFrom: true,
    };
  }

  // Simple product fallback
  let price = simple.finalPrice ?? 0;
  if (price <= 0) price = simple.merchantPrice ?? 0;
  
  return {
    price,
    isFrom: false,
  };
}
