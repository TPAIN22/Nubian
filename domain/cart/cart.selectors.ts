import type { NormalizedProduct } from "../product/product.normalize";
import { isProductActive, hasBackendVariants, isVariantSelectable } from "../product/product.guards";
import type { CartLine } from "./cart.types";
import { matchVariant } from "../variant/variant.match";
import { getFinalPrice } from "@/utils/priceUtils";

export type CartValidationResult = {
  valid: boolean;
  errors: string[];
};

/**
 * Validates cart lines against the latest product snapshot.
 * Mandatory invariants:
 * - product must be active
 * - product must have backend variants to be purchasable
 * - selected variant must exist and be selectable (stock > 0, active)
 */
export function validateCart(lines: CartLine[], productsById: Record<string, NormalizedProduct>): CartValidationResult {
  const errors: string[] = [];

  for (const line of lines) {
    const p = productsById[line.productId];
    if (!isProductActive(p)) {
      errors.push(`Product unavailable: ${line.productId}`);
      continue;
    }
    if (!hasBackendVariants(p)) {
      errors.push(`Product has no variants (not purchasable): ${line.productId}`);
      continue;
    }
    const v = matchVariant(p, line.attributes);
    if (!v) {
      errors.push(`Variant not found: ${line.productId}`);
      continue;
    }
    if (!isVariantSelectable(v)) {
      errors.push(`Variant out of stock/inactive: ${line.productId}`);
      continue;
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getCartTotal(lines: CartLine[], productsById: Record<string, NormalizedProduct>): number {
  let total = 0;
  for (const line of lines) {
    const p = productsById[line.productId];
    if (!p) continue;
    const v = matchVariant(p, line.attributes);
    const price = getFinalPrice(p, { variant: v });
    total += price * Math.max(1, Number(line.quantity) || 1);
  }
  return total;
}

