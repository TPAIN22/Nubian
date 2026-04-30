// Backend Product schema contract (authoritative).
// Synced manually from `nubian-auth/src/models/product.model.js`.

export type ObjectIdString = string;

export type ProductAttributeType = "select" | "text" | "number";

export type ProductAttributeDefDTO = {
  _id: ObjectIdString;
  name: string; // backend: lowercase
  displayName: string;
  type?: ProductAttributeType; // default "select"
  required?: boolean;
  options?: string[];
};

export type ProductVariantDTO = {
  _id: ObjectIdString;
  sku: string;
  attributes: Record<string, string>; // backend stores Map<string,string>, JSON returns plain object

  merchantPrice: number;
  price: number; // legacy mirror

  nubianMarkup?: number;
  dynamicMarkup?: number;
  merchantDiscount?: number;

  // Authoritative pricing block from backend pricing engine (lib/pricing.engine.js).
  // Trust these — never recompute from merchantPrice + nubianMarkup.
  basePrice?: number;
  listPrice?: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;

  // Legacy field — kept for back-compat with old simple products only.
  discountPrice?: number;

  priceConverted?: number;
  priceDisplay?: string;

  // Typed Money envelope from backend (canonical going forward).
  // Stored under `priceEnvelope` rather than `price` because variant.price
  // is overloaded as a numeric mirror in the legacy schema.
  priceEnvelope?: {
    final?: { amount: number; currency: string; formatted?: string; decimals?: number; rate?: number; rateProvider?: string; rateDate?: string | null; rateUnavailable?: boolean };
    original?: { amount: number; currency: string; formatted?: string; decimals?: number; rate?: number; rateProvider?: string; rateDate?: string | null; rateUnavailable?: boolean };
    list?: { amount: number; currency: string; formatted?: string; decimals?: number; rate?: number; rateProvider?: string; rateDate?: string | null; rateUnavailable?: boolean };
    discountAmount?: { amount: number; currency: string; formatted?: string; decimals?: number; rate?: number; rateProvider?: string; rateDate?: string | null; rateUnavailable?: boolean };
    discountPercentage?: number;
    hasDiscount?: boolean;
  };

  stock: number;
  images?: string[];
  isActive?: boolean;
};

export type ProductCategoryDTO =
  | ObjectIdString
  | {
      _id: ObjectIdString;
      name?: string;
      parent?: ObjectIdString | { _id: ObjectIdString; name?: string } | null;
    };

export type ProductDTO = {
  _id: ObjectIdString;
  name: string;
  description: string;

  // simple products
  merchantPrice?: number;
  price?: number;
  stock?: number;

  nubianMarkup?: number;
  dynamicMarkup?: number;

  // Authoritative root pricing block (lowest active variant when applicable).
  basePrice?: number;
  listPrice?: number;
  originalPrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  hasDiscount?: boolean;
  discount?: {
    type?: 'percentage' | 'fixed' | null;
    value?: number;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    maxDiscount?: number | null;
  } | null;

  // Legacy field — kept for back-compat with old simple products only.
  discountPrice?: number;

  sizes?: string[]; // legacy
  colors?: string[]; // legacy

  attributes?: ProductAttributeDefDTO[];
  variants?: ProductVariantDTO[];

  isActive?: boolean;
  dynamicPricingEnabled?: boolean;

  priorityScore?: number;
  featured?: boolean;

  trackingFields?: {
    views24h?: number;
    cartCount24h?: number;
    sales24h?: number;
    favoritesCount?: number;
    scoreCalculatedAt?: string | null;
  };

  rankingFields?: {
    visibilityScore?: number;
    conversionRate?: number;
    storeRating?: number;
    priorityScore?: number;
    featured?: boolean;
  };

  visibilityScore?: number;
  scoreCalculatedAt?: string | null;

  category: ProductCategoryDTO;
  images: string[];
  averageRating?: number;
  reviews?: ObjectIdString[];

  merchant?: ObjectIdString | null;
  deletedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

