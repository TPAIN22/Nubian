import { computePricing } from "@/utils/computePricing";

describe("computePricing", () => {
  it("returns zeros for empty cart and no quote", () => {
    expect(computePricing([])).toEqual({
      subtotal: 0,
      shippingFee: 0,
      discount: 0,
      total: 0,
    });
  });

  it("computes subtotal from items when quote is missing", () => {
    const r = computePricing([
      { unitPrice: 100, quantity: 2 },
      { unitPrice: 50, quantity: 1 },
    ]);
    expect(r.subtotal).toBe(250);
    expect(r.total).toBe(250);
  });

  it("prefers quote.subtotal when positive", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 2 }],
      { subtotal: 175 }
    );
    expect(r.subtotal).toBe(175);
  });

  it("falls back to computed subtotal when quote.subtotal is 0 (backend bug case)", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 2 }],
      { subtotal: 0, shippingFee: 25 }
    );
    expect(r.subtotal).toBe(200);
    expect(r.shippingFee).toBe(25);
    expect(r.total).toBe(225);
  });

  it("adds shipping fee to total", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 1 }],
      { subtotal: 100, shippingFee: 50 }
    );
    expect(r.total).toBe(150);
  });

  it("ignores invalid (negative) shipping fees by clamping to 0", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 1 }],
      { subtotal: 100, shippingFee: -50 }
    );
    expect(r.shippingFee).toBe(0);
    expect(r.total).toBe(100);
  });

  it("subtracts coupon discount when valid", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 2 }],
      { subtotal: 200 },
      { valid: true, discountAmount: 30 }
    );
    expect(r.discount).toBe(30);
    expect(r.total).toBe(170);
  });

  it("ignores discount when coupon not valid", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 2 }],
      { subtotal: 200 },
      { valid: false, discountAmount: 30 }
    );
    expect(r.discount).toBe(0);
    expect(r.total).toBe(200);
  });

  it("clamps total to 0 even when discount exceeds subtotal+shipping", () => {
    const r = computePricing(
      [{ unitPrice: 100, quantity: 1 }],
      { subtotal: 100, shippingFee: 10 },
      { valid: true, discountAmount: 999 }
    );
    expect(r.total).toBe(0);
  });

  it("ignores NaN / non-finite item values", () => {
    const r = computePricing([
      { unitPrice: NaN as any, quantity: 2 },
      { unitPrice: 50, quantity: Infinity as any },
      { unitPrice: 25, quantity: 4 },
    ]);
    expect(r.subtotal).toBe(100);
  });
});
