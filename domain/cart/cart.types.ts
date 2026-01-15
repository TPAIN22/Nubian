import type { SelectedAttributes } from "../product/product.selectors";

/**
 * Frontend cart item reference:
 * - must be compatible with backend cart schema (product + attributes map)
 * - may also store variantId for stable UI linkage, but backend source-of-truth is attributes
 */
export type CartLine = {
  productId: string;
  variantId?: string | null;
  attributes: SelectedAttributes;
  quantity: number;
};

