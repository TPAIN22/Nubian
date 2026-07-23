/**
 * `ProductAttributes` — adapter between the product domain and the reusable
 * `VariantSelector`.
 *
 * The derivation rules are untouched: options still come from
 * `getAttributeOptions`, availability still comes from `isOptionAvailable`, and
 * the attributeDefs → derived-keys fallback is the same code as before. The
 * pills themselves moved to `components/cart/VariantSelector` so the cart, the
 * details page and anything added later share one selector.
 */

import { memo, useMemo } from 'react';
import type { SelectedAttributes } from '@/domain/product/product.selectors';
import {
  normalizeSelectedAttributes,
  getAttributeOptions,
  isOptionAvailable,
} from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import type { LightColors, DarkColors } from '@/theme';
import { VariantSelector, type VariantGroup } from '@/components/cart/VariantSelector';

interface Props {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  onAttributeSelect: (attrName: string, value: string) => void;
  /** Kept for API compatibility; the selector reads the shared palette itself. */
  themeColors?: LightColors | DarkColors;
  pleaseSelectText?: string;
  /** Ring required-but-empty groups once the customer has tried to add. */
  highlightMissing?: boolean;
}

export const ProductAttributes = memo(
  ({
    product,
    selectedAttributes,
    onAttributeSelect,
    pleaseSelectText = 'Please select',
    highlightMissing = false,
  }: Props) => {
    const optionsMap = useMemo(() => getAttributeOptions(product), [product]);

    const attrsList = useMemo(() => {
      if (product.attributeDefs && product.attributeDefs.length > 0) {
        return product.attributeDefs;
      }
      return Object.keys(optionsMap).map(key => ({
        name: key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1),
        required: true,
      }));
    }, [product.attributeDefs, optionsMap]);

    const normalizedSelected = useMemo(
      () => normalizeSelectedAttributes(selectedAttributes),
      [selectedAttributes]
    );

    const groups = useMemo<VariantGroup[]>(() => {
      const out: VariantGroup[] = [];
      for (const attr of attrsList) {
        const key = String(attr.name ?? '').trim().toLowerCase();
        if (!key) continue;

        const options = optionsMap[key] ?? [];
        if (options.length === 0) continue;

        out.push({
          key,
          label: String(attr.displayName || attr.name),
          required: (attr as any).required === true,
          selected: normalizedSelected[key] ?? '',
          options: options.map(value => ({
            value,
            available: isOptionAvailable(product, key, value, normalizedSelected),
          })),
        });
      }
      return out;
    }, [attrsList, optionsMap, normalizedSelected, product]);

    if (!groups.length) return null;

    return (
      <VariantSelector
        groups={groups}
        onSelect={onAttributeSelect}
        highlightMissing={highlightMissing}
        pleaseSelectText={pleaseSelectText}
      />
    );
  }
);
ProductAttributes.displayName = 'ProductAttributes';
