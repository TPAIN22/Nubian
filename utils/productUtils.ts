// utils/productUtils.ts
import type { SelectedAttributes } from "@/types/cart.types";
import type { Product,  } from "@/types/cart.types";
import { normalizeAttributes } from "@/utils/cartUtils";

export type VariantLike = {
  _id?: any;
  id?: any;
  sku?: string;
  attributes?: Record<string, any> | Map<string, any>;
  stock?: any;
  isActive?: any;

  // pricing
  finalPrice?: any;
  merchantPrice?: any;
  price?: any;
  discountPrice?: any;

  images?: any;
};

export type ProductLike = {
  _id?: any;
  id?: any;
  name?: any;
  description?: any;

  isActive?: any;
  stock?: any;
  images?: any;

  sizes?: any;
  colors?: any;

  // dynamic pricing fields
  finalPrice?: any;
  merchantPrice?: any;
  price?: any;
  discountPrice?: any;

  nubianMarkup?: any;
  dynamicMarkup?: any;

  attributes?: any; // product attribute definitions array
  variants?: any;

  category?: any; // string or object
  merchant?: any; // null or object
};

export const safeStr = (v: unknown) => String(v ?? "").trim();
export const safeNum = (v: unknown, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

/** normalize keys same as cartUtils: trim + lowercase */
export const normalizeKey = (k: unknown) => safeStr(k).toLowerCase();

/** unify legacy keys (Color -> color, Size -> size) */
const unifyCommonKeys = (obj: Record<string, string>) => {
  // color
  if (obj.color === undefined && (obj as any).Color) {
    obj.color = (obj as any).Color;
    delete (obj as any).Color;
  }
  // size
  if (obj.size === undefined && (obj as any).Size) {
    obj.size = (obj as any).Size;
    delete (obj as any).Size;
  }
  return obj;
};

export const cleanImages = (images: any): string[] => {
  if (!Array.isArray(images)) return [];
  return images.map((x) => safeStr(x)).filter((x) => x.length > 0);
};

export const normalizeAttributesObject = (
  attrs: Record<string, any> | Map<string, any> | undefined | null
): Record<string, string> => {
  if (!attrs) return {};

  let obj: Record<string, any> = {};
  if (attrs instanceof Map) obj = Object.fromEntries(attrs.entries());
  else if (typeof attrs === "object") obj = attrs as any;

  // ✅ normalize keys + values + drop empties
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = normalizeKey(k);
    const val = safeStr(v);
    if (key && val) out[key] = val;
  }

  return unifyCommonKeys(out);
};

export const normalizeVariant = (v: VariantLike) => {
  const id = safeStr((v as any).id || (v as any)._id);
  return {
    ...v,
    _id: safeStr((v as any)._id || id),
    id,
    sku: safeStr(v.sku),
    isActive: v.isActive !== false,
    stock: safeNum(v.stock, 0),
    images: cleanImages((v as any).images),
    attributes: normalizeAttributesObject(v.attributes),

    // keep dynamic pricing values
    finalPrice: safeNum((v as any).finalPrice, 0),
    merchantPrice: safeNum((v as any).merchantPrice, 0),
    price: safeNum((v as any).price, 0),
    discountPrice: safeNum((v as any).discountPrice, 0),
  };
};
////////////////----------------------------------------////////////////////



// productUtils.ts
// utils/buildAttributeOptions.ts


// utils/productUtils.ts
export function buildAttributeOptions(product: any): Record<string, string[]> {
  if (!product) return {};

  const map: Record<string, Set<string>> = {};

  // 1) seed from product.attributes.options
  const attrs = Array.isArray(product.attributes) ? product.attributes : [];
  for (const a of attrs) {
    const key = String(a?.name ?? "").trim().toLowerCase();
    if (!key) continue;

    if (!map[key]) map[key] = new Set<string>();

    const opts = Array.isArray(a?.options) ? a.options : [];
    for (const v of opts) {
      const val = String(v ?? "").trim();
      if (val) map[key].add(val);
    }
  }

  // 2) derive from variants.attributes (Map or object)
  const variants = Array.isArray(product.variants) ? product.variants : [];
  for (const v of variants) {
    const attrsObj =
      v?.attributes instanceof Map
        ? Object.fromEntries(v.attributes.entries())
        : (v?.attributes ?? {});

    if (!attrsObj || typeof attrsObj !== "object") continue;

    for (const [k0, v0] of Object.entries(attrsObj)) {
      const key = String(k0 ?? "").trim().toLowerCase();
      const val = String(v0 ?? "").trim();
      if (!key || !val) continue;

      if (!map[key]) map[key] = new Set<string>();
      map[key].add(val);
    }
  }

  // 3) convert set->sorted array
  const out: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(map)) {
    out[k] = Array.from(set);
  }

  return out;
}


/////////////////////---------------------------------//////////////////////////

export const normalizeCategory = (cat: any) => {
  if (!cat) return { _id: "", id: "", name: "" };
  if (typeof cat === "string") return { _id: cat, id: cat, name: "" };
  const id = safeStr(cat.id || cat._id);
  return {
    _id: safeStr(cat._id || id),
    id,
    name: safeStr(cat.name),
    slug: cat.slug,
    type: cat.type,
  };
};

export const normalizeMerchant = (m: any) => {
  if (!m) return null;
  const id = safeStr(m.id || m._id);
  return {
    _id: safeStr(m._id || id),
    id,
    businessName: safeStr(m.businessName || m.name),
    status: safeStr(m.status),
    slug: m.slug,
    type: m.type,
  };
};

export const normalizeProduct = (p: ProductLike) => {
  const id = safeStr((p as any).id || (p as any)._id);

  const variantsRaw = Array.isArray((p as any).variants) ? (p as any).variants : [];
  const variants = variantsRaw.map(normalizeVariant);

  // stock: لو المنتج variant-based الأفضل تعتمد aggregate stock من variants
  const aggregateStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
  const stock = safeNum((p as any).stock, 0);
  const finalStock = variants.length ? aggregateStock : stock;

  return {
    ...p,
    _id: safeStr((p as any)._id || id),
    id,
    name: safeStr((p as any).name),
    description: safeStr((p as any).description),
    isActive: (p as any).isActive !== false,

    images: cleanImages((p as any).images),

    sizes: Array.isArray((p as any).sizes) ? (p as any).sizes.map(safeStr).filter(Boolean) : [],
    colors: Array.isArray((p as any).colors) ? (p as any).colors.map(safeStr).filter(Boolean) : [],

    // keep dynamic pricing fields
    finalPrice: safeNum((p as any).finalPrice, 0),
    merchantPrice: safeNum((p as any).merchantPrice, 0),
    price: safeNum((p as any).price, 0),
    discountPrice: safeNum((p as any).discountPrice, 0),

    nubianMarkup: safeNum((p as any).nubianMarkup, 0),
    dynamicMarkup: safeNum((p as any).dynamicMarkup, 0),

    stock: finalStock,
    variants,

    category: normalizeCategory((p as any).category),
    merchant: normalizeMerchant((p as any).merchant),
  };
};

// helper: attributes selection normalization (✅ keys lowercased + unify Color/Size)
export const normalizeSelectedAttributes = (attrs?: SelectedAttributes | null) => {
  const out: Record<string, string> = {};
  if (!attrs) return out;

  for (const [k, v] of Object.entries(attrs)) {
    const key = normalizeKey(k);
    const val = safeStr(v);
    if (key && val) out[key] = val;
  }

  return unifyCommonKeys(out);
};
