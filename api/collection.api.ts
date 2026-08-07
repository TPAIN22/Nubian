import axiosInstance from "@/services/api/client";
import type { ProductDTO } from "@/domain/product/product.types";

/**
 * Collections — curated, ordered product lists.
 *
 * The detail endpoint returns the *same* enriched product representation the
 * catalogue endpoints emit, so `normalizeProduct` and `ProductCard` work on a
 * collection product with no special-casing.
 */

export interface CollectionSummary {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  /** Products the shopper can actually see — deleted/hidden ones are excluded. */
  productCount: number;
}

export interface CollectionDetails extends CollectionSummary {
  products: ProductDTO[];
}

export interface CollectionPage {
  collection: CollectionDetails;
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Fetch a collection and a page of its products.
 *
 * `idOrSlug` accepts either: banner targets carry an ObjectId, campaign links
 * carry a slug, and the backend resolves both on the same route.
 */
export const getCollection = async (
  idOrSlug: string,
  page = 1,
  limit = 20,
  currencyCode?: string | null,
): Promise<CollectionPage> => {
  const response = await axiosInstance.get(`/collections/${idOrSlug}`, {
    // `null` is dropped by the client's param serializer, so an unresolved
    // currency simply means "let the backend default to USD".
    params: { page, limit, currencyCode },
  });

  // The client interceptor unwraps the standard envelope, leaving the payload
  // on `response.data` and pagination on `response.meta` — the extra branches
  // are defensive fallbacks for a non-enveloped or pre-unwrap shape.
  const collection = (response.data?.data ?? response.data) as CollectionDetails;

  if (!collection || !collection._id) {
    throw new Error("Invalid collection data received");
  }

  const pagination =
    (response as any).meta?.pagination ?? (response.data as any)?.meta?.pagination ?? null;

  return {
    collection: { ...collection, products: collection.products ?? [] },
    page: Number(pagination?.page) || page,
    totalPages: Number(pagination?.totalPages) || 1,
    total: Number(pagination?.total) || (collection.products?.length ?? 0),
  };
};

/** Fetch the active collections, in curated order. Used by the home strip. */
export const getCollections = async (limit = 12): Promise<CollectionSummary[]> => {
  const response = await axiosInstance.get("/collections", { params: { limit } });
  const list = response.data?.data ?? response.data ?? [];
  return Array.isArray(list) ? (list as CollectionSummary[]) : [];
};
