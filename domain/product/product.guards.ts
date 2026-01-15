import type { NormalizedProduct } from "./product.normalize";

export function isProductActive(p: NormalizedProduct | null | undefined): p is NormalizedProduct {
  return !!p && p.isActive !== false && !p.deletedAt;
}

export function hasBackendVariants(p: NormalizedProduct | null | undefined): boolean {
  return !!p && Array.isArray(p.variants) && p.variants.length > 0;
}

export function isVariantSelectable(v: { isActive?: boolean; stock: number } | null | undefined): boolean {
  if (!v) return false;
  if (v.isActive === false) return false;
  return (v.stock ?? 0) > 0;
}

