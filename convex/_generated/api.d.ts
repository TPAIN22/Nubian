/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as cart_addToCart from "../cart/addToCart.js";
import type * as cart_getUserCart from "../cart/getUserCart.js";
import type * as cart_removeFromCart from "../cart/removeFromCart.js";
import type * as cart_updateCartItemQuantity from "../cart/updateCartItemQuantity.js";
import type * as http from "../http.js";
import type * as orders_cancelOrder from "../orders/cancelOrder.js";
import type * as orders_createOrder from "../orders/createOrder.js";
import type * as orders_getUserOrders from "../orders/getUserOrders.js";
import type * as products_createProduct from "../products/createProduct.js";
import type * as products_deleteProduct from "../products/deleteProduct.js";
import type * as products_getProducts from "../products/getProducts.js";
import type * as products_updateProduct from "../products/updateProduct.js";
import type * as users_createUser from "../users/createUser.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "cart/addToCart": typeof cart_addToCart;
  "cart/getUserCart": typeof cart_getUserCart;
  "cart/removeFromCart": typeof cart_removeFromCart;
  "cart/updateCartItemQuantity": typeof cart_updateCartItemQuantity;
  http: typeof http;
  "orders/cancelOrder": typeof orders_cancelOrder;
  "orders/createOrder": typeof orders_createOrder;
  "orders/getUserOrders": typeof orders_getUserOrders;
  "products/createProduct": typeof products_createProduct;
  "products/deleteProduct": typeof products_deleteProduct;
  "products/getProducts": typeof products_getProducts;
  "products/updateProduct": typeof products_updateProduct;
  "users/createUser": typeof users_createUser;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
