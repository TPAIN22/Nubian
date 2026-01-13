/**
 * Price Utility Functions
 * Centralized logic for handling product prices across the application
 * 
 * SMART PRICING SYSTEM:
 * - merchantPrice = base price set by merchant
 * - nubianMarkup = base markup percentage (default 10%)
 * - dynamicMarkup = dynamic markup calculated based on demand, trending, stock (0-50%)
 * - finalPrice = merchantPrice + (merchantPrice * nubianMarkup / 100) + (merchantPrice * dynamicMarkup / 100)
 * 
 * SOURCE OF TRUTH:
 * - Always use finalPrice for display (never show below merchantPrice)
 * - finalPrice is calculated automatically by backend
 * - Legacy support: if finalPrice not available, fallback to discountPrice or price
 */

import { Product, ProductVariant } from '@/types/cart.types';

/**
 * Gets the final selling price for a product
 * Uses smart pricing system: finalPrice > discountPrice > price
 * @param product - Product object
 * @param variant - Optional variant (if product has variants)
 * @returns Final price to charge (finalPrice if available, else discountPrice, else price)
 */
export function getFinalPrice(product: Product | null | undefined, variant?: ProductVariant | null): number {
  if (!product) return 0;

  // For variants: prefer variant.finalPrice, fallback to variant.discountPrice, then variant.price
  if (variant) {
    if (variant.finalPrice && variant.finalPrice > 0) {
      return variant.finalPrice;
    }
    if (variant.discountPrice && variant.discountPrice > 0) {
      return variant.discountPrice;
    }
    return variant.price || 0;
  }

  // For products: prefer finalPrice (smart pricing), fallback to discountPrice, then price
  if (product.finalPrice && product.finalPrice > 0) {
    return product.finalPrice;
  }
  if (product.discountPrice && product.discountPrice > 0) {
    return product.discountPrice;
  }
  return product.price || 0;
}

/**
 * Gets the original/base price for a product (merchant price)
 * @param product - Product object
 * @param variant - Optional variant (if product has variants)
 * @returns Original merchant price (merchantPrice if available, else price)
 */
export function getOriginalPrice(product: Product | null | undefined, variant?: ProductVariant | null): number {
  if (!product) return 0;

  // For variants: prefer variant.merchantPrice, fallback to variant.price
  if (variant) {
    if (variant.merchantPrice && variant.merchantPrice > 0) {
      return variant.merchantPrice;
    }
    return variant.price || 0;
  }

  // For products: prefer merchantPrice, fallback to price
  if (product.merchantPrice && product.merchantPrice > 0) {
    return product.merchantPrice;
  }
  return product.price || 0;
}

/**
 * Checks if a product has an active discount or markup
 * @param product - Product object
 * @param variant - Optional variant
 * @returns true if finalPrice differs from merchantPrice (either discount or markup)
 */
export function hasDiscount(product: Product | null | undefined, variant?: ProductVariant | null): boolean {
  if (!product) return false;

  const originalPrice = getOriginalPrice(product, variant);
  const finalPrice = getFinalPrice(product, variant);

  // Has discount if final price is less than original (legacy discount)
  // Or has markup if final price is greater than original (smart pricing)
  return finalPrice !== originalPrice;
}

/**
 * Gets the pricing breakdown for display (optional)
 * @param product - Product object
 * @param variant - Optional variant
 * @returns Object with merchantPrice, nubianMarkup, dynamicMarkup, finalPrice
 */
export function getPricingBreakdown(product: Product | null | undefined, variant?: ProductVariant | null): {
  merchantPrice: number;
  nubianMarkup: number;
  dynamicMarkup: number;
  finalPrice: number;
} {
  if (!product) {
    return { merchantPrice: 0, nubianMarkup: 0, dynamicMarkup: 0, finalPrice: 0 };
  }

  if (variant) {
    return {
      merchantPrice: variant.merchantPrice || variant.price || 0,
      nubianMarkup: variant.nubianMarkup || 10,
      dynamicMarkup: variant.dynamicMarkup || 0,
      finalPrice: getFinalPrice(product, variant),
    };
  }

  return {
    merchantPrice: product.merchantPrice || product.price || 0,
    nubianMarkup: product.nubianMarkup || 10,
    dynamicMarkup: product.dynamicMarkup || 0,
    finalPrice: getFinalPrice(product),
  };
}

/**
 * Calculates discount percentage
 * @param originalPrice - Original price
 * @param finalPrice - Final price after discount
 * @returns Discount percentage (0-100)
 */
export function calculateDiscountPercentage(originalPrice: number, finalPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || !finalPrice || finalPrice < 0) {
    return 0;
  }
  if (finalPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

/**
 * Formats price for display
 * @param price - Price to format
 * @param currency - Currency code (default: 'SDG')
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'SDG'): string {
  const validPrice = typeof price === 'number' && !isNaN(price) && isFinite(price) ? price : 0;
  return new Intl.NumberFormat('ar-SDG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(validPrice);
}
