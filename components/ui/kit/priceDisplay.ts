/**
 * Presentation rules for the price block, kept free of React so they can be
 * tested and reused without a render harness.
 *
 * The strikethrough and the discount badge are **two independent decisions**.
 * Collapsing them into one flag is what this module exists to prevent.
 */

/**
 * Should the was-price be struck through beside the price?
 *
 * **The rule is `original > final`, compared numerically.**
 *
 * Two things it is deliberately *not*:
 *
 *  - Not `original !== value` on the **formatted strings**. That was the
 *    original Issue #9 bug in the other direction: it is a proxy for the real
 *    question and it breaks on formatting.
 *
 *  - Not the backend's `hasDiscount` flag. `hasDiscount` is currency-invariant
 *    truth about the *product* — it stays true even when currency conversion
 *    rounds the converted pair together. In that collapse case the backend now
 *    reports `original === final` and `discountAmount === 0` rather than
 *    fabricating a larger original, precisely so the app never overstates a
 *    saving. Gating the strikethrough on `hasDiscount` would then render a
 *    struck-through price identical to the price itself: it looks like a bug,
 *    and claiming a saving of zero is arguably deceptive.
 *
 * The badge is the surface that still tells the customer a sale is on in that
 * case — see `shouldShowDiscountBadge`.
 *
 * When the numeric amounts are not available the formatted-string comparison
 * remains as a last-resort fallback for legacy payloads.
 */
export function shouldShowOriginal(args: {
  /** Pre-formatted was-price. No string to show ⇒ nothing to strike through. */
  original?: string | null;
  /** Pre-formatted current price. */
  value: string;
  /** Numeric was-price, in the displayed currency. */
  originalAmount?: number | null;
  /** Numeric current price, in the displayed currency. */
  valueAmount?: number | null;
}): boolean {
  const { original, value, originalAmount, valueAmount } = args;

  if (!original) return false;

  if (typeof originalAmount === "number" && typeof valueAmount === "number") {
    return originalAmount > valueAmount;
  }

  return original !== value;
}

/**
 * Should the discount badge render?
 *
 * `discountPercentage` passes through currency conversion unmodified — it is a
 * ratio, so it is currency-invariant — which makes it the one signal that
 * survives the rounding collapse. A product genuinely on sale therefore still
 * shows its "-20%" even on the payloads where `original === final` and the
 * strikethrough is correctly suppressed.
 */
export function shouldShowDiscountBadge(discountPercentage?: number | null): boolean {
  return typeof discountPercentage === "number" && discountPercentage > 0;
}
