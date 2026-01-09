/**
 * Price Utility Functions
 * Centralized logic for handling product prices across the application
 * 
 * SOURCE OF TRUTH:
 * - price = original/base price (required)
 * - discountPrice = final selling price AFTER discount (optional)
 * - If discountPrice exists and > 0, use discountPrice as final price
 * - If discountPrice does NOT exist or is 0, use price as final price
 */

import { Product, ProductVariant } from '@/types/cart.types';

/**
 * Gets the final selling price for a product
 * @param product - Product object
 * @param variant - Optional variant (if product has variants)
 * @returns Final price to charge (discountPrice if exists, else price)
 */
export function getFinalPrice(product: Product | null | undefined, variant?: ProductVariant | null): number {
  if (!product) return 0;

  // For variants: prefer variant.discountPrice, fallback to variant.price
  if (variant) {
    if (variant.discountPrice && variant.discountPrice > 0) {
      return variant.discountPrice;
    }
    return variant.price || 0;
  }

  // For products: prefer discountPrice (final price), fallback to price (original)
  if (product.discountPrice && product.discountPrice > 0) {
    return product.discountPrice;
  }
  return product.price || 0;
}

/**
 * Gets the original/base price for a product
 * @param product - Product object
 * @param variant - Optional variant (if product has variants)
 * @returns Original price (always price, never discountPrice)
 */
export function getOriginalPrice(product: Product | null | undefined, variant?: ProductVariant | null): number {
  if (!product) return 0;

  // For variants: use variant.price (original)
  if (variant) {
    return variant.price || 0;
  }

  // For products: use price (original)
  return product.price || 0;
}

/**
 * Checks if a product has an active discount
 * @param product - Product object
 * @param variant - Optional variant
 * @returns true if discountPrice exists and is less than original price
 */
export function hasDiscount(product: Product | null | undefined, variant?: ProductVariant | null): boolean {
  if (!product) return false;

  const originalPrice = getOriginalPrice(product, variant);
  const finalPrice = getFinalPrice(product, variant);

  // Has discount if final price is less than original and discountPrice exists
  if (variant) {
    return !!(variant.discountPrice && variant.discountPrice > 0 && finalPrice < originalPrice);
  }
  return !!(product.discountPrice && product.discountPrice > 0 && finalPrice < originalPrice);
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
