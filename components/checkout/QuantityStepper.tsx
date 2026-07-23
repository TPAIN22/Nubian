/**
 * `QuantityStepper` is now an alias for `components/cart/QuantitySelector`.
 *
 * The two were the same control with different polish, and having both meant
 * the cart line and the (future) details-page quantity picker could drift. The
 * props are unchanged, so every existing call site — `CartItemCard`,
 * `OrderItemsCard`, checkout — keeps working with no edit.
 */

import { QuantitySelector, type QuantitySelectorProps } from '@/components/cart/QuantitySelector';

export type QuantityStepperProps = QuantitySelectorProps;

export const QuantityStepper = QuantitySelector;
