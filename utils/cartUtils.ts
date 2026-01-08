/**
 * Cart Utility Functions
 * Provides reusable functions for cart operations, attribute handling, and validation
 */

import {
  Product,
  ProductAttribute,
  ProductVariant,
  SelectedAttributes,
  AttributeValidationResult,
} from '@/types/cart.types';

/**
 * Normalizes attribute values to ensure consistency
 * Handles null, undefined, empty strings, and string "null"/"undefined"
 */
export function normalizeAttributeValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value).trim();
  const lowerValue = stringValue.toLowerCase();
  if (lowerValue === 'null' || lowerValue === 'undefined' || lowerValue === '') {
    return '';
  }
  return stringValue;
}

/**
 * Normalizes an attributes object by normalizing all values
 */
export function normalizeAttributes(attributes: SelectedAttributes | undefined | null): SelectedAttributes {
  if (!attributes || typeof attributes !== 'object') {
    return {};
  }

  const normalized: SelectedAttributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    const normalizedValue = normalizeAttributeValue(value);
    // Only include non-empty attributes
    if (normalizedValue !== '') {
      normalized[key] = normalizedValue;
    }
  }
  return normalized;
}

/**
 * Converts legacy size field to attributes format
 * Maintains backward compatibility
 */
export function sizeToAttributes(size: string | undefined | null): SelectedAttributes {
  const normalizedSize = normalizeAttributeValue(size);
  if (normalizedSize === '') {
    return {};
  }
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

  // If size is provided and not already in attributes, add it
  if (normalizedSize !== '' && !normalizedAttrs.size) {
    normalizedAttrs.size = normalizedSize;
  }

  return normalizedAttrs;
}

/**
 * Generates a unique key for a cart item based on product ID and attributes
 * Used to identify if two cart items are the same (same product + same attributes)
 */
export function generateCartItemKey(productId: string, attributes: SelectedAttributes | undefined | null): string {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  const normalizedAttrs = normalizeAttributes(attributes);

  // Sort attribute keys for consistent hashing
  const sortedKeys = Object.keys(normalizedAttrs).sort();

  // Create a string representation: "key1:value1|key2:value2|..."
  const attrString = sortedKeys
    .map(key => `${key}:${normalizedAttrs[key]}`)
    .join('|');

  // Return key in format: "productId|attr1:val1|attr2:val2"
  return attrString ? `${productId}|${attrString}` : productId;
}

/**
 * Compares two attribute objects to determine if they represent the same variant
 */
export function areAttributesEqual(
  attrs1: SelectedAttributes | undefined | null,
  attrs2: SelectedAttributes | undefined | null
): boolean {
  const normalized1 = normalizeAttributes(attrs1);
  const normalized2 = normalizeAttributes(attrs2);

  const keys1 = Object.keys(normalized1).sort();
  const keys2 = Object.keys(normalized2).sort();

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every(key => normalized1[key] === normalized2[key]);
}

/**
 * Validates that required attributes are present
 */
export function validateRequiredAttributes(
  productAttributes: ProductAttribute[] | undefined | null,
  selectedAttributes: SelectedAttributes | undefined | null
): AttributeValidationResult {
  if (!productAttributes || !Array.isArray(productAttributes)) {
    return { valid: true, missing: [] };
  }

  const normalizedSelected = normalizeAttributes(selectedAttributes);
  const required = productAttributes.filter(attr => attr.required === true);
  const missing = required.filter(
    attr => !normalizedSelected[attr.name] || normalizedSelected[attr.name].trim() === ''
  );

  return {
    valid: missing.length === 0,
    missing: missing.map(attr => attr.displayName || attr.name),
  };
}

/**
 * Gets all available attributes for a product
 * Returns both legacy (sizes, colors) and new flexible attributes
 */
export function getProductAttributes(product: Product): {
  sizes?: string[];
  colors?: string[];
  attributes?: ProductAttribute[];
} {
  return {
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : undefined,
    colors: product.colors && product.colors.length > 0 ? product.colors : undefined,
    attributes: product.attributes && product.attributes.length > 0 ? product.attributes : undefined,
  };
}

/**
 * Checks if a product has any selectable attributes
 */
export function hasSelectableAttributes(product: Product): boolean {
  const attrs = getProductAttributes(product);
  return !!(attrs.sizes || attrs.colors || attrs.attributes);
}

/**
 * Gets the display text for a cart item's attributes
 * Useful for showing attribute summary in cart UI
 */
export function getAttributesDisplayText(attributes: SelectedAttributes | undefined | null): string {
  const normalized = normalizeAttributes(attributes);
  if (Object.keys(normalized).length === 0) {
    return '';
  }

  return Object.entries(normalized)
    .map(([key, value]) => {
      // Capitalize first letter of key
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
      return `${displayKey}: ${value}`;
    })
    .join(', ');
}

/**
 * Extracts attributes from a cart item
 * Handles both new Map format (from backend) and legacy size field
 */
export function extractCartItemAttributes(item: {
  size?: string;
  attributes?: SelectedAttributes | Map<string, string>;
}): SelectedAttributes {
  // If attributes is a Map (from Mongoose), convert it
  if (item.attributes instanceof Map) {
    const obj: SelectedAttributes = {};
    for (const [key, value] of item.attributes.entries()) {
      obj[key] = value;
    }
    return normalizeAttributes(obj);
  }

  // If attributes is already an object
  if (item.attributes && typeof item.attributes === 'object' && !(item.attributes instanceof Map)) {
    return normalizeAttributes(item.attributes as SelectedAttributes);
  }

  // Fall back to legacy size field
  if (item.size) {
    return sizeToAttributes(item.size);
  }

  return {};
}

/**
 * Finds a matching variant for a product based on selected attributes
 */
export function findMatchingVariant(
  product: Product,
  selectedAttributes: SelectedAttributes | undefined | null
): ProductVariant | null {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  const normalizedAttrs = normalizeAttributes(selectedAttributes);

  // Find variant that matches all selected attributes
  return product.variants.find(variant => {
    const variantAttrs = variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes;

    // Check if all selected attributes match variant attributes
    const allMatch = Object.keys(normalizedAttrs).every(key => {
      const variantValue = variantAttrs[key];
      return variantValue && variantValue === normalizedAttrs[key];
    });

    // Also check that variant has no extra required attributes that aren't selected
    const variantKeys = Object.keys(variantAttrs);
    const selectedKeys = Object.keys(normalizedAttrs);
    
    // For variant to match, all variant attribute keys should be in selected attributes
    // (unless the product has optional attributes)
    return allMatch && variantKeys.every(key => selectedKeys.includes(key));
  }) || null;
}

/**
 * Gets the stock for a product, considering variants if applicable
 */
export function getProductStock(
  product: Product,
  selectedAttributes: SelectedAttributes | undefined | null
): number {
  // If product has variants, find matching variant and return its stock
  if (product.variants && product.variants.length > 0) {
    const variant = findMatchingVariant(product, selectedAttributes);
    if (variant) {
      return variant.stock || 0;
    }
    // If no matching variant found, return 0 (variant not available)
    return 0;
  }

  // For simple products, return product stock
  return product.stock || 0;
}

/**
 * Checks if a product/variant is available (has stock and is active)
 */
export function isProductAvailable(
  product: Product,
  selectedAttributes: SelectedAttributes | undefined | null
): boolean {
  // If isActive is explicitly false, product is not available
  // If isActive is undefined/null, assume it's active (backward compatibility)
  if (product.isActive === false) {
    return false;
  }

  // For variant products, check variant availability
  if (product.variants && product.variants.length > 0) {
    const variant = findMatchingVariant(product, selectedAttributes);
    if (!variant) {
      return false; // No matching variant
    }
    // If variant.isActive is explicitly false, it's not available
    // If undefined/null, assume it's active (backward compatibility)
    if (variant.isActive === false) {
      return false;
    }
    return (variant.stock || 0) > 0;
  }

  // For simple products, check product stock
  return (product.stock || 0) > 0;
}
