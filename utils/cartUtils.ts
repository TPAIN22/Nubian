
import type {
  ProductAttribute,
  AttributeValidationResult,
  Product,
  ProductVariant,
  SelectedAttributes,
} from "@/types/cart.types";

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
  productAttributes: ProductAttribute[] | undefined | null,
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
export function getProductAttributes(product: Product): {
  sizes: string[] | undefined;
  colors: string[] | undefined;
  attributes: ProductAttribute[] | undefined;
} {
  return {
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : undefined,
    colors: product.colors && product.colors.length > 0 ? product.colors : undefined,
    attributes: product.attributes && product.attributes.length > 0 ? product.attributes : undefined,
  };
}

export function hasSelectableAttributes(product: Product): boolean {
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

/** Normalize variant attributes (Map | object) into {lowerKey: value} */
function normalizeVariantAttributes(variant: ProductVariant): Record<string, string> {
  const attrsRaw: any =
    variant?.attributes instanceof Map
      ? Object.fromEntries(variant.attributes.entries())
      : (variant?.attributes ?? {});

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrsRaw)) {
    const key = normalizeKey(k);
    const val = normalizeAttributeValue(v);
    if (key && val) out[key] = val;
  }

  return out;
}

/**
 * Find variant that matches selected attributes.
 * - returns null if no selection (Details should force selection)
 * - matches by exact equality on all keys of variant (and also ensures selection doesn't include extra keys missing in variant)
 */
export function findMatchingVariant(product: any, selected: Record<string, any>) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return null;

  const sel: Record<string, string> = {};
  for (const [k, v] of Object.entries(selected || {})) {
    const key = String(k).trim().toLowerCase();
    const val = String(v ?? "").trim().toLowerCase();
    if (key && val) sel[key] = val;
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
      norm[String(k).trim().toLowerCase()] = String(val ?? "").trim().toLowerCase();
    }

    let ok = true;
    for (const key of Object.keys(sel)) {
      if (!norm[key] || norm[key] !== sel[key]) {
        ok = false;
        break;
      }
    }
    if (ok) return v;
  }

  return null;
}


export function getProductStock(product: Product, selectedAttributes: SelectedAttributes | undefined | null): number {
  if (product?.variants?.length) {
    const v = findMatchingVariant(product, selectedAttributes as Record<string, any>);
    return v ? (v.stock || 0) : 0;
  }
  return product?.stock || 0;
}

export function isProductAvailable(product: Product, selectedAttributes: SelectedAttributes | undefined | null): boolean {
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
