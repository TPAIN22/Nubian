
import type { AttributeValidationResult } from "@/types/cart.types";
import type { ProductAttributeDefDTO, ProductDTO } from "@/domain/product/product.types";
import type { SelectedAttributes } from "@/domain/product/product.selectors";

/** Normalize attribute key: trim + lowercase */
function normalizeKey(key: any): string {
  return String(key ?? "").trim().toLowerCase();
}

/**
 * Normalizes attribute values to ensure consistency
 * Handles null, undefined, empty strings, and string "null"/"undefined"
 */
export function normalizeAttributeValue(value: any): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).trim();
  const lowerValue = stringValue.toLowerCase();
  if (lowerValue === "null" || lowerValue === "undefined" || lowerValue === "") return "";
  return stringValue;
}

/**
 * Normalizes an attributes object by normalizing all values
 * Also normalizes keys to lowercase to avoid Color vs color issues.
 */
export function normalizeAttributes(attributes: SelectedAttributes | undefined | null): SelectedAttributes {
  if (!attributes || typeof attributes !== "object") return {};

  const normalized: SelectedAttributes = {};
  for (const [rawKey, rawVal] of Object.entries(attributes)) {
    const key = normalizeKey(rawKey);
    const val = normalizeAttributeValue(rawVal);

    if (key && val !== "") normalized[key] = val;
  }

  // ✅ unify legacy key variants
  // (بعد normalizeKey ما مفروض تبقى موجودة، لكن نخليها احتياط)
  if ((normalized as any).color === undefined && (normalized as any).Color) {
    (normalized as any).color = (normalized as any).Color;
    delete (normalized as any).Color;
  }

  return normalized;
}

/**
 * Converts legacy size field to attributes format
 */
export function sizeToAttributes(size: string | undefined | null): SelectedAttributes {
  const normalizedSize = normalizeAttributeValue(size);
  if (normalizedSize === "") return {};
  return { size: normalizedSize };
}

/**
 * Merges legacy size with new attributes
 * If size is provided and attributes.size is not set, adds size to attributes
 */
export function mergeSizeAndAttributes(
  size: string | undefined | null,
  attributes: SelectedAttributes | undefined | null
): SelectedAttributes {
  const normalizedAttrs = normalizeAttributes(attributes);
  const normalizedSize = normalizeAttributeValue(size);

  if (normalizedSize !== "" && !normalizedAttrs.size) {
    normalizedAttrs.size = normalizedSize;
  }

  return normalizedAttrs;
}

/**
 * Generates a unique key for a cart item based on product ID and attributes
 */
export function generateCartItemKey(productId: string, attributes: SelectedAttributes | undefined | null): string {
  if (!productId) throw new Error("Product ID is required");

  const normalizedAttrs = normalizeAttributes(attributes);
  const sortedKeys = Object.keys(normalizedAttrs).sort();
  const attrString = sortedKeys.map((k) => `${k}:${normalizedAttrs[k]}`).join("|");

  return attrString ? `${productId}|${attrString}` : productId;
}

/**
 * Compares two attribute objects to determine if they represent the same variant
 */
export function areAttributesEqual(
  attrs1: SelectedAttributes | undefined | null,
  attrs2: SelectedAttributes | undefined | null
): boolean {
  const a = normalizeAttributes(attrs1);
  const b = normalizeAttributes(attrs2);

  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;

  return keysA.every((k) => a[k] === b[k]);
}

/**
 * Validates that required attributes are present
 */
export function validateRequiredAttributes(
  productAttributes: ProductAttributeDefDTO[] | undefined | null,
  selectedAttributes: SelectedAttributes | undefined | null
): AttributeValidationResult {
  if (!productAttributes || !Array.isArray(productAttributes)) return { valid: true, missing: [] };

  const selected = normalizeAttributes(selectedAttributes);
  const required = productAttributes.filter((a) => a.required === true);

  const missing = required.filter((a) => {
    const key = normalizeKey(a.name);
    return !selected[key] || selected[key].trim() === "";
  });

  return {
    valid: missing.length === 0,
    missing: missing.map((a) => a.displayName || a.name),
  };
}

/**
 * Gets all available attributes for a product
 */
export function getProductAttributes(product: ProductDTO): {
  sizes: string[] | undefined;
  colors: string[] | undefined;
  attributes: ProductAttributeDefDTO[] | undefined;
} {
  return {
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : undefined,
    colors: product.colors && product.colors.length > 0 ? product.colors : undefined,
    attributes: product.attributes && product.attributes.length > 0 ? product.attributes : undefined,
  };
}

export function hasSelectableAttributes(product: ProductDTO): boolean {
  const attrs = getProductAttributes(product);
  return !!(attrs.sizes || attrs.colors || attrs.attributes);
}

/**
 * Gets display text for attributes
 */
export function getAttributesDisplayText(attributes: SelectedAttributes | undefined | null): string {
  const normalized = normalizeAttributes(attributes);
  if (Object.keys(normalized).length === 0) return "";

  return Object.entries(normalized)
    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
    .join(", ");
}

/**
 * Extracts attributes from a cart item
 * Handles Map (mongoose), object, or legacy size field.
 */
export function extractCartItemAttributes(item: {
  size?: string;
  attributes?: SelectedAttributes | Map<string, string>;
}): SelectedAttributes {
  // Map → object
  if (item?.attributes instanceof Map) {
    const obj: SelectedAttributes = {};
    for (const [k, v] of item.attributes.entries()) {
      obj[normalizeKey(k)] = normalizeAttributeValue(v);
    }
    return normalizeAttributes(obj);
  }

  // object
  if (item?.attributes && typeof item.attributes === "object" && !(item.attributes instanceof Map)) {
    return normalizeAttributes(item.attributes as SelectedAttributes);
  }

  // legacy size
  if (item?.size) return sizeToAttributes(item.size);

  return {};
}

/**
 * Find variant that matches selected attributes.
 * - returns null if no selection (Details should force selection)
 * - strict match: selection keys == variant keys and values are equal (case-insensitive)
 */
export function findMatchingVariant(product: any, selected: Record<string, any>) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  // derive allowed/known attribute keys from product schema (prevents strict mismatches
  // when variants include extra non-attribute fields, and ensures stable matching)
  const allowedKeys = new Set<string>();
  const requiredKeys = new Set<string>();
  const productAttrs = Array.isArray(product?.attributes) ? product.attributes : [];
  for (const a of productAttrs) {
    const key = normalizeKey(a?.name);
    if (!key) continue;
    allowedKeys.add(key);
    if (a?.required === true) requiredKeys.add(key);
  }
  if (Array.isArray(product?.sizes) && product.sizes.length) allowedKeys.add("size");
  if (Array.isArray(product?.colors) && product.colors.length) allowedKeys.add("color");

  const sel: Record<string, string> = {};
  for (const [k, v] of Object.entries(selected || {})) {
    const key = normalizeKey(k);
    const val = normalizeAttributeValue(v).toLowerCase();
    if (key && val) {
      sel[key] = val;
      // include any selected key even if the product schema is incomplete
      allowedKeys.add(key);
    }
  }

  // لو ما في اختيار، ما تحاول تطابق (خليها null عشان UI يطلب اختيار)
  if (!Object.keys(sel).length) return null;

  const toObj = (attrs: any): Record<string, string> => {
    if (!attrs) return {};
    if (attrs instanceof Map) return Object.fromEntries(attrs.entries());
    if (typeof attrs === "object") return attrs;
    return {};
  };

  for (const v of variants) {
    if (v?.isActive === false) continue;

    const attrsObj = toObj(v?.attributes);
    const norm: Record<string, string> = {};
    for (const [k, val] of Object.entries(attrsObj)) {
      const key = normalizeKey(k);
      if (!key || !allowedKeys.has(key)) continue;
      const value = normalizeAttributeValue(val).toLowerCase();
      if (!value) continue;
      norm[key] = value;
    }

    const selKeys = Object.keys(sel);
    const varKeys = Object.keys(norm);

    // must have all required keys selected
    if (requiredKeys.size > 0) {
      let missing = false;
      for (const rk of requiredKeys) {
        if (!sel[rk]) {
          missing = true;
          break;
        }
      }
      if (missing) continue;
    }

    // selection must match this variant exactly (for allowed/known keys)
    // - every selected key must exist on the variant
    // - variant cannot have extra allowed keys not present in selection (avoids ambiguous matches)
    if (varKeys.length !== selKeys.length) continue;

    let ok = true;
    for (const key of selKeys) {
      if (!norm[key] || norm[key] !== sel[key]) {
        ok = false;
        break;
      }
    }
    if (ok) return v;
  }

  return null;
}

/** Any available stock without attribute selection (for list screens). */
export function hasAnyActiveStock(product: any): boolean {
  if (!product) return false;
  if (product?.isActive === false) return false;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length) {
    return variants.some((v: any) => v?.isActive !== false && (v?.stock ?? 0) > 0);
  }
  return (product?.stock ?? 0) > 0;
}

/** Aggregate stock across variants (or product.stock for simple products). */
export function getAggregateStock(product: any): number {
  if (!product) return 0;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (variants.length) {
    return variants.reduce((sum: number, v: any) => sum + (Number(v?.stock) || 0), 0);
  }
  return Number(product?.stock) || 0;
}


export function getProductStock(product: ProductDTO, selectedAttributes: SelectedAttributes | undefined | null): number {
  if (product?.variants?.length) {
    const v = findMatchingVariant(product, selectedAttributes as Record<string, any>);
    return v ? (v.stock || 0) : 0;
  }
  return product?.stock || 0;
}

export function isProductAvailable(product: ProductDTO, selectedAttributes: SelectedAttributes | undefined | null): boolean {
  if (!product) return false;
  if ((product as any).isActive === false) return false;

  // variant product
  if (product?.variants?.length) {
    const v = findMatchingVariant(product, selectedAttributes as Record<string, any>);
    if (!v) return false; // لازم combo صحيح
    if (v.isActive === false) return false;
    return (v.stock || 0) > 0;
  }

  // simple product
  return (product.stock || 0) > 0;
}
