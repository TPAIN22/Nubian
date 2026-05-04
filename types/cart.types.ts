/**
 * Cart DTOs and request payloads.
 *
 * IMPORTANT:
 * - Backend Product schema is defined in `@/domain/product/product.types`
 * - Do NOT add frontend-owned `Product` interfaces here.
 */

import type { ProductDTO } from "@/domain/product/product.types";
import type { SelectedAttributes } from "@/domain/product/product.selectors";

/**
 * Cart item interface
 * Represents a single item in the cart
 */
export interface CartItem {
  product: ProductDTO;
  quantity: number;
  size?: string; // Legacy field for backward compatibility
  attributes?: SelectedAttributes; // New generic attributes
  _id?: string;
}

/**
 * Snapshot of the coupon applied to the cart. The backend recomputes
 * `discountAmount` against the current subtotal on every save, so this is the
 * value to display.
 */
export interface AppliedCoupon {
  couponId?: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number;
  discountAmount: number;
}

/**
 * Cart interface
 * Represents the entire cart
 */
export interface Cart {
  _id?: string;
  user?: string;
  products: CartItem[];
  totalQuantity: number;
  /** Sum of unitFinalPrice * quantity, before discount/shipping. */
  subtotal?: number;
  /** Currently-applied coupon discount in the active currency. */
  discount?: number;
  /** Shipping fee in the active currency (0 until shipping is implemented). */
  shipping?: number;
  /** Final amount: subtotal - discount + shipping (clamped at 0). */
  totalPrice: number;
  appliedCoupon?: AppliedCoupon | null;
  currencyCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Validation result for attribute selection
 */
export interface AttributeValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Add to cart request payload
 */
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}

/**
 * Update cart item request payload
 */
export interface UpdateCartItemRequest {
  productId: string;
  quantity: number; // Change in quantity (can be negative)
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}

/**
 * Remove from cart request payload
 */
export interface RemoveFromCartRequest {
  productId: string;
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}
