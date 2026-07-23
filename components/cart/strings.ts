/**
 * i18n helper for the cart surfaces.
 *
 * `i18n-js` defaults to `missingBehavior: "message"`, so a missing key resolves
 * to `[missing "en.foo" translation]` — a *truthy* string. Every `i18n.t(k) ||
 * 'fallback'` in the codebase is therefore a no-op for keys that don't exist.
 * `tr()` detects that marker (the same trick `store/useCartStore.ts` uses) so a
 * cart string never renders as debug text on a customer's screen.
 */

import i18n from '@/utils/i18n';

export function tr(key: string, fallback: string): string {
  try {
    const value = i18n.t(key);
    if (!value) return fallback;
    if (value === key) return fallback;
    if (typeof value === 'string' && value.startsWith('[missing ')) return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/** Cart copy resolved at call time so a language switch is picked up. */
export const cartStrings = {
  addToCart: () => tr('addToCart', 'Add to cart'),
  adding: () => tr('cart_adding', 'Adding…'),
  added: () => tr('cart_added', 'Added'),
  addedToCart: () => tr('addedToCart', 'Added to cart'),
  viewCart: () => tr('cart_viewCart', 'View cart'),
  outOfStock: () => tr('outOfStock', 'Out of stock'),
  outOfStockHint: () =>
    tr('cart_outOfStockHint', 'Try a different option or check back later.'),
  inStock: () => tr('inStock', 'In stock'),
  lowStock: () => tr('cart_lowStock', 'Low stock'),
  onlyNLeft: (n: number) =>
    `${tr('only', 'Only')} ${n} ${tr('left', 'left')}`,
  selectOptions: () => tr('cart_selectOptions', 'Select options'),
  pleaseSelect: () => tr('pleaseSelect', 'Please select'),
  unavailable: () => tr('cart_unavailable', 'Unavailable'),
  unavailableCombination: () =>
    tr('cart_unavailableCombination', 'This combination is not available'),
  productUnavailable: () => tr('productUnavailable', 'Product unavailable'),
  signInRequired: () => tr('pleaseSignInFirst', 'Please sign in first'),
  signIn: () => tr('signIn', 'Sign in'),
  addError: () => tr('addToCartError', 'Could not add to cart'),
  retry: () => tr('retry', 'Retry'),
  quantity: () => tr('cart_quantity', 'Quantity'),
  increase: () => tr('cart_increaseQuantity', 'Increase quantity'),
  decrease: () => tr('cart_decreaseQuantity', 'Decrease quantity'),
  itemsInCart: (n: number) => `${n} ${tr('items', 'items')}`,
  somethingWentWrong: () => tr('somethingWentWrong', 'Something went wrong'),
  checkConnection: () =>
    tr('cart_checkConnection', 'Check your connection and try again.'),
  loading: () => tr('loading', 'Loading…'),
};
