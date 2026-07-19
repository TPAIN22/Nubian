import axiosInstance from "@/services/api/client";
import type { ProductDTO } from "@/domain/product/product.types";

export interface CategoryDetails {
  _id: string;
  name: string;
  image?: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoryProductsResponse {
  data: ProductDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch category details by ID
 */
export const getCategoryById = async (categoryId: string): Promise<CategoryDetails> => {
  try {
    const response = await axiosInstance.get(`/categories/${categoryId}`);
    const data = response.data?.data || response.data;
    
    if (!data || !data._id) {
      throw new Error("Invalid category data received");
    }
    
    return data as CategoryDetails;
  } catch (error: any) {
    console.error(`Error fetching category ${categoryId}:`, error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to load category details"
    );
  }
};

/**
 * Fetch products filtered by category ID
 */
export const getProductsByCategory = async (
  categoryId: string, 
  page = 1, 
  limit = 20,
  currencyCode?: string
): Promise<CategoryProductsResponse> => {
  try {
    const response = await axiosInstance.get('/products', {
      params: { 
        category: categoryId,
        page,
        limit,
        currencyCode
      }
    });

    let products: ProductDTO[] = [];
    let totalPages = 1;
    let currentPage = page;
    let total = 0;

    // The client interceptor unwraps the standard envelope: for the paginated
    // `/products` response it leaves `response.data` as the product array and
    // hoists pagination to `response.meta.pagination`. The remaining branches
    // stay as defensive fallbacks for any pre-unwrap / non-enveloped shape.
    const meta = (response as any).meta;
    if (Array.isArray(response.data) && meta?.pagination) {
      products = response.data;
      totalPages = Number(meta.pagination.totalPages) || 1;
      currentPage = Number(meta.pagination.page) || page;
      total = Number(meta.pagination.total) || products.length;
    } else if (Array.isArray(response.data?.data) && response.data?.meta?.pagination) {
      products = response.data.data;
      totalPages = Number(response.data.meta.pagination.totalPages) || 1;
      currentPage = Number(response.data.meta.pagination.page) || page;
      total = Number(response.data.meta.pagination.total) || products.length;
    } else if (Array.isArray(response.data?.data) && response.data?.meta?.total) {
      products = response.data.data;
      const resLimit = Number(response.data.meta.limit) || limit;
      total = Number(response.data.meta.total) || 0;
      totalPages = Math.ceil(total / resLimit) || 1;
      currentPage = Number(response.data.meta.page) || page;
    } else if (Array.isArray(response.data?.products)) {
      products = response.data.products;
      totalPages = Number(response.data.totalPages) || 1;
      currentPage = Number(response.data.currentPage) || page;
      total = Number(response.data.totalProducts) || products.length;
    } else if (Array.isArray(response.data?.data)) {
      products = response.data.data;
    } else if (Array.isArray(response.data)) {
      products = response.data;
    }

    return {
      data: products,
      total,
      page: currentPage,
      limit,
      totalPages
    };
  } catch (error: any) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    throw new Error(
      error?.response?.data?.message || 
      error?.message || 
      "Failed to load category products"
    );
  }
};
