import type { ProductAttributeDefDTO, ProductDTO, ProductVariantDTO } from "./product.types";
import type { Money } from "@/utils/priceUtils";
export type { ProductAttributeDefDTO, ProductDTO, ProductVariantDTO };

export type ProductPriceEnvelope = {
  final?: Money;
  original?: Money;
  list?: Money;
  discountAmount?: Money;
  discountPercentage?: number;
  hasDiscount?: boolean;
};

export type ProductCurrencyMeta = {
  code: string;
  symbol: string;
  decimals: number;
  symbolPosition: "before" | "after";
};

export type NormalizedProduct = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  dynamicPricingEnabled: boolean;
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
    
    // Currency fields in simple
    priceDisplay?: string;
    currencyCode?: string;
    priceConverted?: number;
  };

  // backend-provided convenience fields (do not compute)
  productLevelPricing: {
    merchantPrice: number | null;
    finalPrice: number | null;
    nubianMarkup: number | null;
    dynamicMarkup: number | null;
    discountPrice: number | null;
    
    // Currency fields in plp
    priceDisplay?: string;
    currencyCode?: string;
    priceConverted?: number;
  };
  
  // Root-level currency fields (preferred)
  priceDisplay?: string;
  currencyCode?: string;
  priceConverted?: number;
  rate?: number;
  rateUnavailable?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  
  // Definitive Display Pricing (Source of Truth)
  displayOriginalPrice?: number;
  displayFinalPrice?: number;
  displayDiscountPercentage?: number;

  // Typed Money envelope from the backend (canonical going forward).
  // Optional: legacy payloads / cache entries may not have it.
  price?: ProductPriceEnvelope;
  currency?: ProductCurrencyMeta;
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

function passthroughMoney(m: any): Money | undefined {
  if (!m || typeof m !== "object") return undefined;
  if (typeof m.amount !== "number" || typeof m.currency !== "string") return undefined;
  return {
    amount: m.amount,
    currency: m.currency,
    formatted: typeof m.formatted === "string" ? m.formatted : undefined,
    decimals: typeof m.decimals === "number" ? m.decimals : undefined,
    rate: typeof m.rate === "number" ? m.rate : undefined,
    rateProvider: typeof m.rateProvider === "string" ? m.rateProvider : undefined,
    rateDate: typeof m.rateDate === "string" ? m.rateDate : null,
    rateUnavailable: typeof m.rateUnavailable === "boolean" ? m.rateUnavailable : undefined,
  };
}

function passthroughEnvelope(p: any): ProductPriceEnvelope | undefined {
  if (!p || typeof p !== "object") return undefined;
  return {
    final:    passthroughMoney(p.final),
    original: passthroughMoney(p.original),
    list:     passthroughMoney(p.list),
    discountAmount: passthroughMoney(p.discountAmount),
    discountPercentage: typeof p.discountPercentage === "number" ? p.discountPercentage : undefined,
    hasDiscount: typeof p.hasDiscount === "boolean" ? p.hasDiscount : undefined,
  };
}

function normalizeVariant(v: any, attrDefs?: ProductAttributeDefDTO[]): ProductVariantDTO {
  const variantPrice = passthroughEnvelope(v?.price);
  // `price` on a variant is overloaded in the legacy schema (number) vs the new
  // envelope (object). Preserve the envelope under a separate field for safety.
  return {
    _id: asString(v?._id),
    sku: asString(v?.sku),
    attributes: normalizeVariantAttributes(v?.attributes, attrDefs),
    merchantPrice: Number(v?.merchantPrice ?? 0),
    price: typeof v?.price === "number" ? v.price : Number(v?.merchantPrice ?? 0),
    priceEnvelope: variantPrice,
    nubianMarkup: asNum(v?.nubianMarkup) ?? undefined,
    dynamicMarkup: asNum(v?.dynamicMarkup) ?? undefined,
    merchantDiscount: asNum(v?.merchantDiscount) ?? undefined,

    basePrice:          asNum(v?.basePrice) ?? undefined,
    listPrice:          asNum(v?.listPrice) ?? undefined,
    originalPrice:      asNum(v?.originalPrice) ?? undefined,
    finalPrice:         asNum(v?.finalPrice) ?? undefined,
    discountAmount:     asNum(v?.discountAmount) ?? undefined,
    discountPercentage: asNum(v?.discountPercentage) ?? undefined,
    hasDiscount:        typeof v?.hasDiscount === "boolean" ? v.hasDiscount : undefined,

    discountPrice: asNum(v?.discountPrice) ?? undefined,
    priceConverted: asNum(v?.priceConverted) ?? undefined,
    priceDisplay: asString(v?.priceDisplay) || undefined,
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
    dynamicPricingEnabled: raw?.dynamicPricingEnabled === false ? false : true,
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
      
      // Map currency fields (safely check simple object if it exists in raw)
      priceDisplay: asString((raw as any)?.simple?.priceDisplay),
      currencyCode: asString((raw as any)?.simple?.currencyCode),
      priceConverted: asNum((raw as any)?.simple?.priceConverted) ?? undefined,
    },

    productLevelPricing: {
      merchantPrice: asNum(raw?.merchantPrice) ?? asNum(raw?.price),
      finalPrice: asNum(raw?.finalPrice),
      nubianMarkup: asNum(raw?.nubianMarkup),
      dynamicMarkup: asNum(raw?.dynamicMarkup),
      discountPrice: asNum(raw?.discountPrice),
      
      // Map currency fields
      priceDisplay: asString((raw as any)?.productLevelPricing?.priceDisplay),
      currencyCode: asString((raw as any)?.productLevelPricing?.currencyCode),
      priceConverted: asNum((raw as any)?.productLevelPricing?.priceConverted) ?? undefined,
    },

    // Root level currency fields
    priceDisplay: asString((raw as any)?.priceDisplay),
    currencyCode: asString((raw as any)?.currencyCode),
    priceConverted: asNum((raw as any)?.priceConverted) ?? undefined,
    rate: asNum((raw as any)?.rate) ?? undefined,
    rateUnavailable: asBool((raw as any)?.rateUnavailable),
    discountPercentage: asNum((raw as any)?.discountPercentage) ?? undefined,
    originalPrice: asNum((raw as any)?.originalPrice) ?? undefined,

    // Definitive Display Pricing — fall back to priceConverted / originalPrice
    // so that backends returning those field names are handled without code changes everywhere.
    displayFinalPrice: asNum((raw as any)?.displayFinalPrice) ?? asNum((raw as any)?.priceConverted) ?? undefined,
    displayOriginalPrice: asNum((raw as any)?.displayOriginalPrice) ?? asNum((raw as any)?.originalPrice) ?? undefined,
    displayDiscountPercentage: asNum((raw as any)?.displayDiscountPercentage) ?? undefined,

    // Typed Money envelope (canonical). Carried verbatim from the backend.
    price: passthroughEnvelope((raw as any)?.price),
    currency: passthroughCurrencyMeta((raw as any)?.currency),
  };
}

function passthroughCurrencyMeta(c: any): ProductCurrencyMeta | undefined {
  if (!c || typeof c !== "object") return undefined;
  if (typeof c.code !== "string") return undefined;
  return {
    code: c.code,
    symbol: typeof c.symbol === "string" ? c.symbol : c.code,
    decimals: typeof c.decimals === "number" ? c.decimals : 2,
    symbolPosition: c.symbolPosition === "after" ? "after" : "before",
  };
}

