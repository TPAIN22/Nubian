import type { NormalizedProduct } from "../product/product.normalize";

export function getVariantStock(variant: { stock: number } | null | undefined): number {
  return Number.isFinite(Number(variant?.stock)) ? Number(variant!.stock) : 0;
}

export function getSimpleProductStock(product: NormalizedProduct): number {
  const s = product.simple.stock;
  return Number.isFinite(Number(s)) ? Number(s) : 0;
}

