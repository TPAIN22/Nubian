import { NormalizedProduct, ProductVariantDTO } from "../product/product.normalize";

export interface ResolvedPrice {
  final: number;
  merchant: number;
  original?: number;
  currency: string;
  requiresSelection: boolean;
  source: "variant" | "simple" | "none" | "definitive";
  discount?: {
    amount: number;
    percentage: number;
  };
  breakdown?: {
    merchantPrice: number;
    nubianMarkup: number;
    dynamicMarkup: number;
    finalPrice: number;
  };
}

export interface PricingOptions {
  product: NormalizedProduct;
  selectedVariant?: ProductVariantDTO | null;
  currency?: string;
}
