import type { NormalizedProduct } from "./product.normalize";
import { isVariantSelectable } from "./product.guards";

export type SelectedAttributes = Record<string, string>;

const normKey = (k: any) => String(k ?? "").trim().toLowerCase();
const normVal = (v: any) => String(v ?? "").trim();

export function normalizeSelectedAttributes(input: any): SelectedAttributes {
  if (!input || typeof input !== "object") return {};
  const out: SelectedAttributes = {};
  for (const [k, v] of Object.entries(input)) {
    const key = normKey(k);
    const val = normVal(v);
    if (key && val) out[key] = val;
  }
  return out;
}

/**
 * Derive attribute options strictly from backend data.
 * Priority:
 * - product.attributeDefs[].options (backend-provided)
 * - otherwise derive from variants[].attributes for selectable variants only (still backend data)
 */
export function getAttributeOptions(p: NormalizedProduct): Record<string, string[]> {
  const options: Record<string, Set<string>> = {};

  // 1) backend definitions first
  for (const def of p.attributeDefs) {
    const key = normKey(def.name);
    if (!key) continue;
    options[key] = options[key] || new Set<string>();
    for (const opt of def.options || []) {
      const v = normVal(opt);
      if (v) options[key].add(v);
    }
  }

  // 2) derive from selectable variants (never invent)
  for (const v of p.variants) {
    if (!isVariantSelectable(v)) continue;
    for (const [k, raw] of Object.entries(v.attributes || {})) {
      const key = normKey(k);
      const val = normVal(raw);
      if (!key || !val) continue;
      options[key] = options[key] || new Set<string>();
      options[key].add(val);
    }
  }

  const out: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(options)) {
    out[k] = Array.from(set);
  }
  return out;
}

/**
 * Check if a specific attribute option is "selectable" given other current selections.
 * An option is selectable if there exists AT LEAST ONE active variant that has this 
 * attribute value AND matches all OTHER currently selected attributes.
 */
export function isOptionAvailable(
  product: NormalizedProduct,
  attrName: string,
  optionValue: string,
  currentSelection: SelectedAttributes
): boolean {
  if (!product.variants.length) return true; // Simple product logic doesn't apply here

  const keyLower = normKey(attrName);
  const valLower = normVal(optionValue);

  return product.variants.some((v) => {
    if (!isVariantSelectable(v)) return false;

    const vAttrs = v.attributes || {};
    
    // 1. Must match the option itself
    if (normVal(vAttrs[keyLower]) !== valLower) return false;

    // 2. Must match all OTHER selected attributes
    for (const [sKey, sVal] of Object.entries(currentSelection)) {
      if (sKey === keyLower) continue; // Skip the one we are checking
      if (normVal(vAttrs[sKey]) !== normVal(sVal)) return false;
    }

    return true;
  });
}

