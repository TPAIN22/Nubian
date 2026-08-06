import { asAmount, resolveOrderLinePricing } from "@/utils/orderLinePricing";

/**
 * Regression suite for Issue #4 — the order screen could never show a discount.
 *
 * The shape here mirrors `orders.model.js:28-35` as snapshotted by
 * `order.service.js:193-212`: a line carries `price`, `merchantPrice`,
 * `originalPrice`, `discountAmount` and `discountPercentage`, and never the
 * `display*` aliases.
 */

/** A line as the backend actually snapshots it, discounted. */
const discountedLine = {
  price: 104,
  merchantPrice: 100,
  originalPrice: 130,
  discountAmount: 26,
  discountPercentage: 20,
};

/** The same line with no sale running: original === price, no discount fields. */
const undiscountedLine = {
  price: 130,
  merchantPrice: 100,
  originalPrice: 130,
  discountAmount: 0,
  discountPercentage: 0,
};

describe("resolveOrderLinePricing — the real order-line shape (Issue #4)", () => {
  test("a discounted line reports a discount and the historical was-price", () => {
    const result = resolveOrderLinePricing(discountedLine);

    expect(result.finalPrice).toBe(104);
    // The value that used to be read correctly and then overwritten by the
    // synthetic-normalizeProduct fallback.
    expect(result.originalPrice).toBe(130);
    expect(result.discountPercentage).toBe(20);
    expect(result.discountAmount).toBe(26);
    expect(result.hasDiscount).toBe(true);
  });

  test("a line with no sale renders no strikethrough and fabricates nothing", () => {
    const result = resolveOrderLinePricing(undiscountedLine);

    expect(result.finalPrice).toBe(130);
    expect(result.originalPrice).toBe(130);
    expect(result.hasDiscount).toBe(false);
  });

  test("merchantPrice is never used as the was-price", () => {
    // The old dashboard/mobile bug: original := merchantPrice, which is COST.
    // A line with no originalPrice must fall back to its own price, so the
    // strikethrough is absent rather than showing the platform's cost.
    const result = resolveOrderLinePricing({ price: 130, merchantPrice: 100 });

    expect(result.originalPrice).toBe(130);
    expect(result.originalPrice).not.toBe(100);
    expect(result.hasDiscount).toBe(false);
  });

  test("the display* aliases order lines never carry are absent, not fatal", () => {
    // Every `display*` field is undefined on a real line. Before the fix this
    // combination produced hasDiscount === false unconditionally.
    const result = resolveOrderLinePricing(discountedLine);

    expect((discountedLine as Record<string, unknown>).displayFinalPrice).toBeUndefined();
    expect((discountedLine as Record<string, unknown>).displayDiscountPercentage).toBeUndefined();
    expect(result.hasDiscount).toBe(true);
  });

  test("display* aliases are still honoured when a product-shaped payload arrives", () => {
    // Kept as a fallback so an enriched product passed to this screen (e.g. a
    // re-order flow reusing the row) still renders.
    const result = resolveOrderLinePricing({
      displayFinalPrice: 80,
      displayOriginalPrice: 100,
      displayDiscountPercentage: 20,
    });

    expect(result.finalPrice).toBe(80);
    expect(result.originalPrice).toBe(100);
    expect(result.discountPercentage).toBe(20);
    expect(result.hasDiscount).toBe(true);
  });

  test("a discount visible only in discountAmount still shows", () => {
    const result = resolveOrderLinePricing({ price: 104, discountAmount: 26 });
    expect(result.hasDiscount).toBe(true);
  });

  test("showStrikethrough is strictly original > final, independent of hasDiscount", () => {
    // The display contract app-wide: only a real gap justifies a struck-through
    // number. A percentage alone must not draw a line through a price equal to
    // itself — that reads as a bug and claims a saving of zero.
    const collapsed = resolveOrderLinePricing({
      price: 390,
      originalPrice: 390,
      discountPercentage: 20,
      discountAmount: 0,
    });
    expect(collapsed.hasDiscount).toBe(true);
    expect(collapsed.showStrikethrough).toBe(false);

    const real = resolveOrderLinePricing({ price: 104, originalPrice: 130, discountPercentage: 20 });
    expect(real.showStrikethrough).toBe(true);

    expect(resolveOrderLinePricing(undiscountedLine).showStrikethrough).toBe(false);
  });

  test("a discount visible only in the price pair still shows", () => {
    const result = resolveOrderLinePricing({ price: 104, originalPrice: 130 });
    expect(result.hasDiscount).toBe(true);
    expect(result.discountPercentage).toBe(0);
  });

  test("survives a missing or empty line", () => {
    for (const line of [null, undefined, {}]) {
      const result = resolveOrderLinePricing(line);
      expect(result.finalPrice).toBe(0);
      expect(result.originalPrice).toBe(0);
      expect(result.hasDiscount).toBe(false);
    }
  });
});

describe("asAmount", () => {
  test("accepts finite numbers, including zero and negatives", () => {
    expect(asAmount(0)).toBe(0);
    expect(asAmount(12.5)).toBe(12.5);
    expect(asAmount(-3)).toBe(-3);
  });

  test("rejects the Money envelope object rather than yielding NaN", () => {
    // `Number({ amount: 104 })` is NaN. Reading the envelope as a number is the
    // failure that nulls pricing fields elsewhere in the codebase.
    expect(asAmount({ amount: 104, currency: "USD" })).toBeNull();
    expect(asAmount({})).toBeNull();
  });

  test("rejects null, undefined, strings and NaN", () => {
    expect(asAmount(null)).toBeNull();
    expect(asAmount(undefined)).toBeNull();
    expect(asAmount("104")).toBeNull();
    expect(asAmount(Number.NaN)).toBeNull();
    expect(asAmount(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
