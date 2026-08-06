/**
 * Pricing for a line on a placed order.
 *
 * An order line is **not** a product, and that distinction is the whole reason
 * this module exists. `orders.model.js` snapshots `price`, `merchantPrice`,
 * `originalPrice`, `discountAmount` and `discountPercentage` onto each line at
 * purchase time (`order.service.js`), so the historical price the customer
 * actually paid is preserved even after the catalogue moves on. What an order
 * line never carries is the `display*` aliases that enriched *product* payloads
 * do.
 *
 * The order screen used to ask for `displayFinalPrice` / `displayOriginalPrice`
 * / `displayDiscountPercentage` anyway. Those always missed, which made the
 * has-discount flag permanently false and — worse — made a guard on
 * `display* === undefined` permanently true, so a fallback fired that rebuilt a
 * synthetic single-variant product with no `originalPrice` and overwrote the
 * correct value that had just been read. The result was an order screen that
 * could not render a strikethrough even once, with the right number sitting
 * unused in the payload.
 */

/** The subset of an order line this module reads. All fields are optional. */
export type OrderLinePricingInput = {
  /** What the customer paid per unit. The authoritative final price. */
  price?: unknown;
  /** The was-price at purchase time. */
  originalPrice?: unknown;
  discountAmount?: unknown;
  discountPercentage?: unknown;
  /**
   * Platform cost. Read by nothing here, on purpose — see `resolveOrderLinePricing`.
   */
  merchantPrice?: unknown;
  /** Legacy aliases. Present on enriched product payloads, never on order lines. */
  displayFinalPrice?: unknown;
  displayOriginalPrice?: unknown;
  displayDiscountPercentage?: unknown;
};

export type OrderLinePricing = {
  finalPrice: number;
  originalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  /**
   * Was this line discounted at all? True if *any* snapshotted signal says so.
   * Use it for copy ("you saved…"), analytics, or a badge — **not** to decide a
   * strikethrough. See `showStrikethrough`.
   */
  hasDiscount: boolean;
  /**
   * Should the was-price be struck through? Strictly `original > final`.
   *
   * Kept separate from `hasDiscount` for the same reason the rest of the app
   * separates them: if the two prices are equal there is no saving to show, and
   * striking through a price identical to the price reads as a bug and claims a
   * saving of zero.
   */
  showStrikethrough: boolean;
};

/**
 * Read a money/percentage field off an order line.
 *
 * Returns null rather than 0 for anything absent or non-numeric so callers can
 * tell "not sent" from "sent as zero" with `??`. Non-numbers are rejected on
 * purpose: `price` is a plain number on an order line but the Money envelope
 * **object** on an enriched product payload, and `Number({})` is `NaN`.
 */
export function asAmount(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Derive what an order line should display.
 *
 * `merchantPrice` is deliberately never consulted as a was-price. It is the
 * platform's cost, the pricing engine guarantees `price >= merchantPrice`, and
 * substituting it for `originalPrice` is the exact bug this replaced.
 */
export function resolveOrderLinePricing(line: OrderLinePricingInput | null | undefined): OrderLinePricing {
  const finalPrice = asAmount(line?.price) ?? asAmount(line?.displayFinalPrice) ?? 0;

  // Fall back to the final price, never to zero: an absent was-price means
  // "no discount", and a 0 here would render a strikethrough of nothing.
  const originalPrice =
    asAmount(line?.originalPrice) ?? asAmount(line?.displayOriginalPrice) ?? finalPrice;

  const discountPercentage =
    asAmount(line?.discountPercentage) ?? asAmount(line?.displayDiscountPercentage) ?? 0;
  const discountAmount = asAmount(line?.discountAmount) ?? 0;

  // Any one of the three snapshotted signals is enough. Because percentage and
  // amount are stored alongside the prices, this does not depend on the two
  // prices surviving currency rounding as distinct values — the failure mode
  // that erases strikethroughs elsewhere in the app.
  const hasDiscount = discountPercentage > 0 || discountAmount > 0 || originalPrice > finalPrice;

  // The one thing that justifies drawing a line through a number.
  const showStrikethrough = originalPrice > finalPrice;

  return {
    finalPrice,
    originalPrice,
    discountPercentage,
    discountAmount,
    hasDiscount,
    showStrikethrough,
  };
}
