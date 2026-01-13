/**
 * Cart-related TypeScript types and interfaces
 * Provides type safety for cart operations across the application
 */

/**
 * Product attribute definition
 * Defines what attributes a product can have
 */
export interface ProductAttribute {
  name: string;
  displayName: string;
  type: 'select' | 'text' | 'number';
  required: boolean;
  options?: string[];
}

/**
 * Selected attributes for a cart item
 * Key-value pairs where key is attribute name and value is selected option
 */
export interface SelectedAttributes {
  [key: string]: string;
}

/**
 * Product variant (from backend)
 */
export interface ProductVariant {
  _id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number; // Legacy field - use merchantPrice if available
  merchantPrice?: number; // Base price set by merchant
  nubianMarkup?: number; // Base markup percentage (default 10%)
  dynamicMarkup?: number; // Dynamic markup calculated by system (0-50%)
  finalPrice?: number; // Calculated final price (merchantPrice + markups)
  discountPrice?: number; // Legacy discount price
  stock: number;
  images?: string[];
  isActive: boolean;
}

/**
 * Product interface (matches backend structure)
 */
export interface Product {
  _id: string;
  name: string;
  description?: string;
  // Smart pricing fields
  merchantPrice?: number; // Base price set by merchant
  nubianMarkup?: number; // Base markup percentage (default 10%)
  dynamicMarkup?: number; // Dynamic markup calculated by system (0-50%)
  finalPrice?: number; // Calculated final price (merchantPrice + markups)
  // Legacy pricing fields
  price?: number; // Optional for variant-based products (maps to merchantPrice)
  discountPrice?: number; // Legacy discount price
  images: string[];
  stock?: number; // Optional for variant-based products (calculated from variants)
  sizes?: string[]; // Legacy field
  colors?: string[]; // Color options
  attributes?: ProductAttribute[]; // New flexible attributes
  variants?: ProductVariant[]; // Product variants
  category?: string | { _id: string; name: string };
  merchant?: string;
  averageRating?: number;
  reviews?: string[];
  isActive?: boolean;
  // Tracking fields (24-hour metrics)
  trackingFields?: {
    views24h?: number;
    cartCount24h?: number;
    sales24h?: number;
    favoritesCount?: number;
  };
  // Ranking fields
  rankingFields?: {
    visibilityScore?: number;
    priorityScore?: number;
    featured?: boolean;
    conversionRate?: number;
    storeRating?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Cart item interface
 * Represents a single item in the cart
 */
export interface CartItem {
  product: Product;
  quantity: number;
  size?: string; // Legacy field for backward compatibility
  attributes?: SelectedAttributes; // New generic attributes
  _id?: string;
}

/**
 * Cart interface
 * Represents the entire cart
 */
export interface Cart {
  _id?: string;
  user?: string;
  products: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Validation result for attribute selection
 */
export interface AttributeValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Add to cart request payload
 */
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}

/**
 * Update cart item request payload
 */
export interface UpdateCartItemRequest {
  productId: string;
  quantity: number; // Change in quantity (can be negative)
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}

/**
 * Remove from cart request payload
 */
export interface RemoveFromCartRequest {
  productId: string;
  size?: string; // Legacy field
  attributes?: SelectedAttributes; // New generic attributes
}
