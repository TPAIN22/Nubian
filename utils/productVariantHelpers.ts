import { ProductDTO, ProductVariantDTO } from "@/domain/product/product.types";

export function getHasAttr(product: ProductDTO, attrName: string): boolean {
  if (!product.attributes || product.attributes.length === 0) return false;
  return product.attributes.some(
    (a) => a.name.toLowerCase() === attrName.toLowerCase()
  );
}

export function getActiveVariants(variants: ProductVariantDTO[] = []): ProductVariantDTO[] {
  return variants.filter((v) => v.isActive !== false);
}

export function getUniqueColors(variants: ProductVariantDTO[]): string[] {
  const colors = new Set<string>();
  getActiveVariants(variants).forEach((v) => {
    if (v.attributes && v.attributes.color) {
      colors.add(v.attributes.color);
    }
  });
  return Array.from(colors);
}

export function getSizesForColor(variants: ProductVariantDTO[], color: string): string[] {
  const sizes = new Set<string>();
  getActiveVariants(variants).forEach((v) => {
    if (
      v.attributes &&
      v.attributes.color === color &&
      v.attributes.size
    ) {
      sizes.add(v.attributes.size);
    }
  });
  return Array.from(sizes);
}

export function getColorImages(variants: ProductVariantDTO[], color: string): string[] {
  const active = getActiveVariants(variants);
  // Find ALL variants with this color that have images
  // Logic: "returns images from the first variant of that color that has images.length > 0"
  // OR we could aggregate all images from all variants of that color?
  // Requirement says: "returns images from the first variant of that color that has images.length > 0"
  const variantWithImages = active.find(
    (v) => v.attributes?.color === color && v.images && v.images.length > 0
  );

  return variantWithImages?.images || [];
}

export function resolveSelectedVariant(
  variants: ProductVariantDTO[],
  selectedColor: string | null,
  selectedSize: string | null
): ProductVariantDTO | undefined {
  return getActiveVariants(variants).find((v) => {
    const matchColor = selectedColor
      ? v.attributes?.color === selectedColor
      : true;
    const matchSize = selectedSize
      ? v.attributes?.size === selectedSize
      : true;
    return matchColor && matchSize;
  });
}

export function getVariantPrice(
  product: ProductDTO,
  variant?: ProductVariantDTO
): { finalPrice: number; originalPrice: number; hasDiscount: boolean } {
  // If variant is selected, use its pricing
  if (variant) {
    const final = variant.finalPrice ?? variant.merchantPrice ?? 0;
    const original = variant.merchantPrice ?? 0;
    return {
      finalPrice: final,
      originalPrice: original,
      hasDiscount: final < original,
    };
  }

  // Fallback to product level
  const final = product.finalPrice ?? product.price ?? product.merchantPrice ?? 0;
  const original = product.price ?? product.merchantPrice ?? 0;
  return {
    finalPrice: final,
    originalPrice: original,
    hasDiscount: final < original,
  };
}
