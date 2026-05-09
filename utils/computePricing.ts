/**
 * Single source of truth for checkout pricing math.
 *
 * Rules (in order):
 *   - subtotal     = quote.subtotal if backend returned a positive number, else sum of items.
 *   - shippingFee  = quote.shippingFee, default 0.
 *   - discount     = couponResult.discountAmount when coupon is valid; clamped to >= 0.
 *   - total        = max(0, subtotal + shippingFee - discount).
 */
export type PricingItem = {
  unitPrice: number;
  quantity: number;
};

export type PricingQuote = {
  subtotal?: number;
  shippingFee?: number;
} | null | undefined;

export type PricingCoupon = {
  valid?: boolean;
  discountAmount?: number;
} | null | undefined;

export type PricingResult = {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
};

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function computePricing(
  items: PricingItem[],
  quote?: PricingQuote,
  couponResult?: PricingCoupon
): PricingResult {
  const computedSubtotal = (items ?? []).reduce(
    (sum, it) => sum + num(it.unitPrice) * num(it.quantity),
    0
  );

  const quoteSubtotal = num(quote?.subtotal);
  const subtotal = quoteSubtotal > 0 ? quoteSubtotal : computedSubtotal;

  const shippingFee = Math.max(0, num(quote?.shippingFee));

  const discount =
    couponResult?.valid && Number.isFinite(couponResult.discountAmount)
      ? Math.max(0, num(couponResult.discountAmount))
      : 0;

  const total = Math.max(0, subtotal + shippingFee - discount);

  return { subtotal, shippingFee, discount, total };
}
