import type { NormalizedProduct } from "../product/product.normalize";
import type { SelectedAttributes } from "../product/product.selectors";
import { normalizeSelectedAttributes } from "../product/product.selectors";
import { isVariantSelectable } from "../product/product.guards";

export function matchVariant(
  product: NormalizedProduct,
  selected: SelectedAttributes
): NormalizedProduct["variants"][number] | null {
  const sel = normalizeSelectedAttributes(selected);
  const selKeys = Object.keys(sel);
  if (selKeys.length === 0) return null;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  for (const v of variants) {
    if (!isVariantSelectable(v)) continue;

    const attrs = v.attributes || {};
    let ok = true;
    for (const k of selKeys) {
      if (!attrs[k] || attrs[k] !== sel[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return v;
  }

  return null;
}

/**
 * Pick a stable display variant for list/cards, derived strictly from backend variants.
 * Strategy: cheapest selectable variant by backend `finalPrice`, falling back to first selectable.
 */
export function pickDisplayVariant(
  product: NormalizedProduct
): NormalizedProduct["variants"][number] | null {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selectable = variants.filter(isVariantSelectable);
  if (selectable.length === 0) return null;

  const scorePrice = (v: any) =>
    Number(v.finalPrice ?? v.discountPrice ?? v.merchantPrice ?? v.price ?? Infinity);

  return selectable.reduce((best, v) => {
    const price = scorePrice(v);
    const bestPrice = scorePrice(best);
    return price < bestPrice ? v : best;
  }, selectable[0]!);
}

