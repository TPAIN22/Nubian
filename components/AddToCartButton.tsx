/**
 * `AddToCartButton` — thin composition of `useAddToCart` (behaviour) and
 * `CartActionButton` (presentation).
 *
 * This file used to be ~290 lines of validation, auth handling, store calls,
 * analytics, console logging and inline `StyleSheet` all in one component.
 * All of that behaviour now lives in `components/cart/useAddToCart.ts`
 * unchanged — same order, same calls, same edge cases — and the visuals live in
 * `components/cart/CartActionButton.tsx`. The public props are unchanged, so
 * `ProductActions` and `BottomSheet` keep working without edits.
 */

import { useRef } from 'react';
import { View, type TextStyle, type ViewStyle } from 'react-native';

import type { SelectedAttributes } from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';

import { CartActionButton, type CartActionButtonSize } from './cart/CartActionButton';
import { useAddToCart } from './cart/useAddToCart';

type Props = {
  product: NormalizedProduct;
  title?: string;
  buttonStyle?: ViewStyle | any;
  textStyle?: TextStyle;
  disabled?: boolean;
  selectedSize?: string;
  selectedAttributes?: SelectedAttributes;
  onPressAttempt?: () => void;
  /** Visual size of the CTA. Defaults to the large sticky-bar size. */
  size?: CartActionButtonSize;
  /** Analytics `screen` dimension. */
  screen?: string;
  /** Image used by the fly-to-cart animation. Defaults to the first image. */
  imageUri?: string | null;
  /** Set false to suppress the flight + confirmation card. */
  richFeedback?: boolean;
  testID?: string;
};

const AddToCartButton = ({
  product,
  title,
  buttonStyle,
  textStyle,
  disabled,
  selectedSize,
  selectedAttributes,
  onPressAttempt,
  size = 'lg',
  screen = 'product_details',
  imageUri,
  richFeedback = true,
  testID,
}: Props) => {
  // Measured on press so the flying thumbnail launches from the real button.
  const sourceRef = useRef<View | null>(null);

  const { visualState, addToCart, disabledReason } = useAddToCart({
    product,
    selectedSize,
    selectedAttributes,
    disabled,
    onPressAttempt,
    screen,
    sourceRef,
    imageUri,
    richFeedback,
  });

  return (
    <CartActionButton
      ref={sourceRef}
      state={visualState}
      onPress={addToCart}
      label={title}
      size={size}
      style={buttonStyle}
      textStyle={textStyle}
      testID={testID}
      // Kept from the original component: surfaces *why* the CTA is inert while
      // developing, never in a shipped build.
      footnote={__DEV__ && visualState !== 'default' ? disabledReason : null}
    />
  );
};

export default AddToCartButton;
