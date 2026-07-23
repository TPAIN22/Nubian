/**
 * Cart experience module.
 *
 * Split by responsibility: `useAddToCart` owns behaviour, everything else is
 * presentation, and `cartFeedback` is the (state-free) bus that connects a
 * press anywhere in the app to the global animation layer.
 */

export { useAddToCart, LOW_STOCK_THRESHOLD, SUCCESS_HOLD_MS } from './useAddToCart';
export type {
  AddToCartStatus,
  AddToCartVisualState,
  StockLevel,
  UseAddToCartOptions,
  UseAddToCartResult,
} from './useAddToCart';

export { CartActionButton } from './CartActionButton';
export type { CartActionButtonProps, CartActionButtonSize } from './CartActionButton';

export { CartBadge } from './CartBadge';
export { CartAnimationLayer } from './CartAnimationLayer';
export { CartSuccessOverlay, CONFIRMATION_DURATION_MS } from './CartSuccessOverlay';
export { CartErrorState } from './CartErrorState';
export { classifyCartError } from './cartErrors';
export type { CartErrorKind } from './cartErrors';

export { QuantitySelector } from './QuantitySelector';
export type { QuantitySelectorProps } from './QuantitySelector';

export { StockIndicator } from './StockIndicator';
export { VariantSelector } from './VariantSelector';
export type { VariantGroup, VariantOption } from './VariantSelector';
export { QuickAddButton } from './QuickAddButton';

export { ButtonSpinner } from './ButtonSpinner';
export { SuccessCheck } from './SuccessCheck';

export {
  setCartTarget,
  getCartTarget,
  flyToCart,
  bumpCartBadge,
  showCartConfirmation,
  subscribeFlights,
  subscribeBump,
  subscribeConfirmations,
} from './cartFeedback';
export type { CartFlight, CartConfirmation, Rect } from './cartFeedback';

export { cartStrings, tr } from './strings';
