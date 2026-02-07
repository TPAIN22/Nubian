import type { ProductAttributeDefDTO, ProductDTO, ProductVariantDTO } from "./product.types";
export type { ProductAttributeDefDTO, ProductDTO, ProductVariantDTO };

export type NormalizedProduct = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  deletedAt: string | null;

  categoryId: string;
  categoryName?: string;

  merchantId: string | null;
  images: string[];

  // Backend attribute definitions (preferred UI driver)
  attributeDefs: ProductAttributeDefDTO[];

  // Backend variants (preferred purchase driver)
  variants: ProductVariantDTO[];

  // Backend simple-product fields (only used if variants empty)
  simple: {
    stock: number | null;
    merchantPrice: number | null;
    finalPrice: number | null;
    nubianMarkup: number | null;
    dynamicMarkup: number | null;
    discountPrice: number | null;
  };

  // backend-provided convenience fields (do not compute)
  productLevelPricing: {
    merchantPrice: number | null;
    finalPrice: number | null;
    nubianMarkup: number | null;
    dynamicMarkup: number | null;
    discountPrice: number | null;
  };
};

function asString(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asBool(v: any, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asString(x)).filter(Boolean);
}

function normalizeVariantAttributes(attrs: any, attrDefs?: ProductAttributeDefDTO[]): Record<string, string> {
  if (!attrs) return {};

  const out: Record<string, string> = {};

  // If attrs is an array, support common shapes: [{name,value}], [{key,value}], ["XL"] when only one attrDef
  if (Array.isArray(attrs)) {
    for (const entry of attrs) {
      if (entry && typeof entry === "object") {
        const key = asString((entry as any).name ?? (entry as any).key ?? (entry as any).attr)
          .trim()
          .toLowerCase();
        const val = asString((entry as any).value ?? (entry as any).val ?? (entry as any).option ?? (entry as any).label)
          .trim();
        if (key && val) out[key] = val;
      } else if (typeof entry === "string" && attrDefs && attrDefs.length === 1) {
        const key = asString(attrDefs[0]?.name).trim().toLowerCase();
        const val = asString(entry).trim();
        if (key && val) out[key] = val;
      }
    }
    return out;
  }

  if (typeof attrs === "object") {
    // Handle Map if it hasn't been transformed
    const entries = (attrs instanceof Map) ? Array.from(attrs.entries()) : Object.entries(attrs);
    for (const [k, v] of entries) {
      const key = asString(k).trim().toLowerCase();
      const val = asString(v).trim();
      if (key && val) out[key] = val;
    }
    return out;
  }

  return out;
}

function normalizeVariant(v: any, attrDefs?: ProductAttributeDefDTO[]): ProductVariantDTO {
  return {
    _id: asString(v?._id),
    sku: asString(v?.sku),
    attributes: normalizeVariantAttributes(v?.attributes, attrDefs),
    merchantPrice: Number(v?.merchantPrice ?? 0),
    price: Number(v?.price ?? v?.merchantPrice ?? 0),
    nubianMarkup: asNum(v?.nubianMarkup) ?? undefined,
    dynamicMarkup: asNum(v?.dynamicMarkup) ?? undefined,
    finalPrice: asNum(v?.finalPrice) ?? undefined,
    discountPrice: asNum(v?.discountPrice) ?? undefined,
    stock: Number(v?.stock ?? 0),
    images: asStringArray(v?.images),
    isActive: v?.isActive === false ? false : true,
  };
}

function normalizeAttrDef(a: any): ProductAttributeDefDTO {
  return {
    _id: asString(a?._id),
    name: asString(a?.name).trim().toLowerCase(),
    displayName: asString(a?.displayName).trim(),
    type: a?.type,
    required: asBool(a?.required, false),
    options: asStringArray(a?.options),
  };
}

export function normalizeProduct(raw: ProductDTO): NormalizedProduct {
  const id = asString(raw?._id);
  const category = raw?.category as any;
  const categoryId = typeof category === "string" ? category : asString(category?._id);
  const categoryName = typeof category === "object" && category ? asString(category?.name) || undefined : undefined;

  const attributeDefs = Array.isArray(raw?.attributes) ? raw.attributes.map(normalizeAttrDef) : [];
  const variants = Array.isArray(raw?.variants) ? raw.variants.map((v) => normalizeVariant(v, attributeDefs)) : [];

  return {
    id,
    name: asString(raw?.name),
    description: asString(raw?.description),
    isActive: raw?.isActive === false ? false : true,
    deletedAt: raw?.deletedAt ? asString(raw.deletedAt) : null,

    categoryId,
    categoryName,

    merchantId: raw?.merchant == null ? null : asString(raw.merchant),
    images: asStringArray(raw?.images),

    attributeDefs,
    variants,

    simple: {
      stock: variants.length ? null : asNum(raw?.stock),
      merchantPrice: variants.length ? null : (asNum(raw?.merchantPrice) ?? asNum(raw?.price)),
      finalPrice: variants.length ? null : asNum(raw?.finalPrice),
      nubianMarkup: variants.length ? null : asNum(raw?.nubianMarkup),
      dynamicMarkup: variants.length ? null : asNum(raw?.dynamicMarkup),
      discountPrice: variants.length ? null : asNum(raw?.discountPrice),
    },

    productLevelPricing: {
      merchantPrice: asNum(raw?.merchantPrice) ?? asNum(raw?.price),
      finalPrice: asNum(raw?.finalPrice),
      nubianMarkup: asNum(raw?.nubianMarkup),
      dynamicMarkup: asNum(raw?.dynamicMarkup),
      discountPrice: asNum(raw?.discountPrice),
    },
  };
}

