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
  finalPrice?: number;
  discountPrice?: number;

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
  finalPrice?: number; // may be populated even for variant products (UI convenience)
  discountPrice?: number;

  sizes?: string[]; // legacy
  colors?: string[]; // legacy

  attributes?: ProductAttributeDefDTO[];
  variants?: ProductVariantDTO[];

  isActive?: boolean;

  priorityScore?: number;
  featured?: boolean;

  trackingFields?: {
    views24h?: number;
    cartCount24h?: number;
    sales24h?: number;
    favoritesCount?: number;
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

