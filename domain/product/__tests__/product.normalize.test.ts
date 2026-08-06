import { normalizeProduct, type NormalizedProduct } from "../product.normalize";
import type { ProductDTO } from "../product.types";

/**
 * `normalizeProduct` must be idempotent (Issue #20).
 *
 * This is not a purity nicety. `store/wishlistStore.js:70` pushes the
 * *already-normalized* object out of `ProductCard` into the store and persists
 * it to AsyncStorage; `app/(tabs)/wishlist.tsx:32` then calls
 * `normalizeProduct` on it again on the next read. Before the fix the second
 * pass read root fields the first pass had never emitted, so
 * `productLevelPricing.finalPrice` went to `null` and
 * `productLevelPricing.merchantPrice` went to `null` too (its fallback ran
 * `Number()` over the Money envelope **object** → `NaN` → `null`). Only the
 * `price` envelope survived the round trip, which is why the wishlist limped
 * along instead of going blank — the failure was invisible in review.
 */

const money = (amount: number, formatted: string) => ({
  amount,
  currency: "SAR",
  formatted,
  decimals: 2,
  rate: 3.75,
  rateProvider: "ecb",
  rateDate: "2026-08-01",
  rateUnavailable: false,
});

/** An enriched variant product, exactly as `enrichProductWithPricing` emits it. */
const enrichedVariantProduct = {
  _id: "p1",
  name: "Thobe",
  description: "A thobe",
  isActive: true,
  dynamicPricingEnabled: true,
  category: { _id: "cat1", name: "Clothing" },
  merchant: "m1",
  images: ["https://cdn/a.jpg", "https://cdn/b.jpg"],

  merchantPrice: 100,
  basePrice: 100,
  listPrice: 130,
  originalPrice: 130,
  finalPrice: 104,
  discountAmount: 26,
  discountPercentage: 20,
  hasDiscount: true,

  displayFinalPrice: 104,
  displayOriginalPrice: 130,
  displayDiscountPercentage: 20,

  price: {
    final: money(104, "SAR 104.00"),
    original: money(130, "SAR 130.00"),
    list: money(130, "SAR 130.00"),
    discountAmount: money(26, "SAR 26.00"),
    discountPercentage: 20,
    hasDiscount: true,
  },
  currency: { code: "SAR", symbol: "SAR", decimals: 2, symbolPosition: "after" },

  attributes: [
    { _id: "a1", name: "Size", displayName: "Size", type: "select", required: true, options: ["S", "M"] },
  ],
  variants: [
    {
      _id: "v1",
      sku: "TH-S",
      attributes: { Size: "S" },
      merchantPrice: 100,
      nubianMarkup: 30,
      dynamicMarkup: 0,
      merchantDiscount: 0,
      basePrice: 100,
      listPrice: 130,
      originalPrice: 130,
      finalPrice: 104,
      discountAmount: 26,
      discountPercentage: 20,
      hasDiscount: true,
      stock: 5,
      isActive: true,
      images: ["https://cdn/v1.jpg"],
      price: {
        final: money(104, "SAR 104.00"),
        original: money(130, "SAR 130.00"),
        discountPercentage: 20,
        hasDiscount: true,
      },
    },
  ],
} as unknown as ProductDTO;

/** An enriched simple product — no variants, pricing lives on the root. */
const enrichedSimpleProduct = {
  _id: "p2",
  name: "Oud",
  description: "Oud oil",
  category: "cat2",
  merchant: "m2",
  images: ["https://cdn/o.jpg"],
  stock: 12,
  merchantPrice: 50,
  finalPrice: 65,
  originalPrice: 80,
  nubianMarkup: 30,
  dynamicMarkup: 0,
  discountPercentage: 19,
  hasDiscount: true,
  price: {
    final: money(65, "SAR 65.00"),
    original: money(80, "SAR 80.00"),
    discountPercentage: 19,
    hasDiscount: true,
  },
} as unknown as ProductDTO;

/** A legacy, un-enriched document — the shape `GET /api/wishlist` returns today. */
const legacyProduct = {
  _id: "p3",
  name: "Legacy",
  description: "",
  category: "cat3",
  images: [],
  price: 40,
  stock: 3,
  variants: [],
} as unknown as ProductDTO;

const cases: [string, ProductDTO][] = [
  ["enriched variant product", enrichedVariantProduct],
  ["enriched simple product", enrichedSimpleProduct],
  ["legacy un-enriched document", legacyProduct],
];

describe("normalizeProduct — idempotency (Issue #20)", () => {
  test.each(cases)("%s round-trips unchanged through a second pass", (_label, raw) => {
    const once = normalizeProduct(raw);
    const twice = normalizeProduct(once as unknown as ProductDTO);

    expect(twice).toEqual(once);
  });

  test.each(cases)("%s is stable across a third pass too", (_label, raw) => {
    const once = normalizeProduct(raw);
    const thrice = normalizeProduct(
      normalizeProduct(once as unknown as ProductDTO) as unknown as ProductDTO,
    );

    expect(thrice).toEqual(once);
  });

  test("a JSON round trip (AsyncStorage) does not change the result", () => {
    // wishlistStore persists through AsyncStorage, so the second pass actually
    // sees a JSON-serialized copy — undefined keys are dropped en route.
    const once = normalizeProduct(enrichedVariantProduct);
    const persisted = JSON.parse(JSON.stringify(once)) as ProductDTO;

    expect(normalizeProduct(persisted)).toEqual(once);
  });

  describe("the specific fields that used to rot", () => {
    let once: NormalizedProduct;
    let twice: NormalizedProduct;

    beforeEach(() => {
      once = normalizeProduct(enrichedVariantProduct);
      twice = normalizeProduct(once as unknown as ProductDTO);
    });

    test("productLevelPricing.finalPrice survives (was null)", () => {
      expect(once.productLevelPricing.finalPrice).toBe(104);
      expect(twice.productLevelPricing.finalPrice).toBe(104);
    });

    test("productLevelPricing.merchantPrice survives (was null via Number(envelope))", () => {
      expect(once.productLevelPricing.merchantPrice).toBe(100);
      expect(twice.productLevelPricing.merchantPrice).toBe(100);
    });

    test("root finalPrice / merchantPrice are emitted, so the second pass finds them", () => {
      expect(once.finalPrice).toBe(104);
      expect(once.merchantPrice).toBe(100);
      expect(twice.finalPrice).toBe(104);
      expect(twice.merchantPrice).toBe(100);
    });

    test("the variant Money envelope survives (was dropped: v.price becomes a number)", () => {
      expect(once.variants[0]?.priceEnvelope?.final?.amount).toBe(104);
      expect(twice.variants[0]?.priceEnvelope?.final?.amount).toBe(104);
      expect(twice.variants[0]?.priceEnvelope?.original?.amount).toBe(130);
    });

    test("category, merchant and attribute definitions survive the rename", () => {
      // Each of these is read from one key and written to another.
      expect(twice.categoryId).toBe("cat1");
      expect(twice.categoryName).toBe("Clothing");
      expect(twice.merchantId).toBe("m1");
      expect(twice.attributeDefs).toHaveLength(1);
      expect(twice.attributeDefs[0]?.name).toBe("size");
      expect(twice.id).toBe("p1");
    });

    test("the root price envelope and discount signals survive", () => {
      expect(twice.price?.final?.amount).toBe(104);
      expect(twice.price?.hasDiscount).toBe(true);
      expect(twice.discountPercentage).toBe(20);
      expect(twice.hasDiscount).toBe(true);
      expect(twice.originalPrice).toBe(130);
    });

    test("a simple product keeps its `simple` block across passes", () => {
      const s1 = normalizeProduct(enrichedSimpleProduct);
      const s2 = normalizeProduct(s1 as unknown as ProductDTO);

      expect(s1.simple.finalPrice).toBe(65);
      expect(s1.simple.merchantPrice).toBe(50);
      expect(s1.simple.stock).toBe(12);
      expect(s2.simple.finalPrice).toBe(65);
      expect(s2.simple.merchantPrice).toBe(50);
      expect(s2.simple.stock).toBe(12);
      expect(s2.simple.nubianMarkup).toBe(30);
    });
  });
});

describe("normalizeProduct — the overloaded `price` key", () => {
  test("the Money envelope is never read as a numeric merchantPrice", () => {
    // `enrichProductWithPricing` always emits `price` as the envelope object.
    // `Number({...})` is NaN, which used to null out merchantPrice.
    const noMerchantPrice = {
      _id: "p4",
      name: "X",
      description: "",
      category: "c",
      images: [],
      price: { final: money(99, "SAR 99.00"), hasDiscount: false },
    } as unknown as ProductDTO;

    const result = normalizeProduct(noMerchantPrice);

    expect(result.productLevelPricing.merchantPrice).toBeNull();
    expect(Number.isNaN(result.productLevelPricing.merchantPrice as number)).toBe(false);
    expect(result.price?.final?.amount).toBe(99);
  });

  test("a legacy numeric `price` is still honoured as merchantPrice", () => {
    const result = normalizeProduct(legacyProduct);

    expect(result.merchantPrice).toBe(40);
    expect(result.productLevelPricing.merchantPrice).toBe(40);
    expect(result.simple.merchantPrice).toBe(40);
    // A bare number is not an envelope.
    expect(result.price).toBeUndefined();
  });
});

describe("normalizeProduct — variant attribute shapes", () => {
  const withVariantAttrs = (attributes: unknown, attrDefs = [{ _id: "a1", name: "Size", displayName: "Size" }]) =>
    normalizeProduct({
      _id: "pa",
      name: "A",
      description: "",
      category: "c",
      images: [],
      attributes: attrDefs,
      variants: [{ _id: "v1", sku: "S", attributes, merchantPrice: 10, stock: 1, isActive: true }],
    } as unknown as ProductDTO);

  test("a plain object is lowercased and trimmed", () => {
    expect(withVariantAttrs({ " Size ": " M " }).variants[0]?.attributes).toEqual({ size: "M" });
  });

  test("a Map is handled when it has not been JSON-transformed", () => {
    // Mongoose stores variant attributes as Map<string,string>.
    expect(withVariantAttrs(new Map([["Size", "L"]])).variants[0]?.attributes).toEqual({ size: "L" });
  });

  test("an array of {name,value} / {key,value} / {attr,option} entries", () => {
    expect(withVariantAttrs([{ name: "Size", value: "XL" }]).variants[0]?.attributes).toEqual({ size: "XL" });
    expect(withVariantAttrs([{ key: "Size", val: "XS" }]).variants[0]?.attributes).toEqual({ size: "XS" });
    expect(withVariantAttrs([{ attr: "Size", option: "S" }]).variants[0]?.attributes).toEqual({ size: "S" });
    expect(withVariantAttrs([{ name: "Size", label: "M" }]).variants[0]?.attributes).toEqual({ size: "M" });
  });

  test("a bare string array binds to the sole attribute definition", () => {
    expect(withVariantAttrs(["XL"]).variants[0]?.attributes).toEqual({ size: "XL" });
  });

  test("a bare string array is ignored when the definition is ambiguous", () => {
    const twoDefs = [
      { _id: "a1", name: "Size", displayName: "Size" },
      { _id: "a2", name: "Color", displayName: "Color" },
    ];
    expect(withVariantAttrs(["XL"], twoDefs).variants[0]?.attributes).toEqual({});
  });

  test("incomplete and non-object entries are dropped rather than half-written", () => {
    expect(withVariantAttrs([{ name: "Size" }, { value: "M" }, null, 42]).variants[0]?.attributes).toEqual({});
    expect(withVariantAttrs(undefined).variants[0]?.attributes).toEqual({});
    expect(withVariantAttrs("not-an-object").variants[0]?.attributes).toEqual({});
  });

  test("every shape is stable across a second pass", () => {
    // The array forms normalize *into* the object form, so idempotency here is
    // a real conversion, not a no-op.
    for (const attrs of [{ Size: "M" }, [{ name: "Size", value: "M" }], ["M"], new Map([["Size", "M"]])]) {
      const once = withVariantAttrs(attrs);
      expect(normalizeProduct(once as unknown as ProductDTO)).toEqual(once);
      expect(once.variants[0]?.attributes).toEqual({ size: "M" });
    }
  });
});

describe("normalizeProduct — discount signal hoisting (supports Issue #12)", () => {
  test("a percentage carried only by the envelope reaches the root", () => {
    // The payload class where ProductCard rendered a discounted price with no
    // badge and no strikethrough, because it never consulted the envelope.
    const envelopeOnly = {
      _id: "p5",
      name: "Envelope only",
      description: "",
      category: "c",
      images: [],
      finalPrice: 80,
      price: {
        final: money(80, "SAR 80.00"),
        original: money(100, "SAR 100.00"),
        discountPercentage: 20,
        hasDiscount: true,
      },
    } as unknown as ProductDTO;

    const result = normalizeProduct(envelopeOnly);

    expect(result.discountPercentage).toBe(20);
    expect(result.hasDiscount).toBe(true);
    // And it stays put on a second pass.
    expect(normalizeProduct(result as unknown as ProductDTO).discountPercentage).toBe(20);
  });

  test("an explicit root percentage wins over the envelope's", () => {
    const conflicting = {
      _id: "p6",
      name: "Conflict",
      description: "",
      category: "c",
      images: [],
      discountPercentage: 30,
      price: { discountPercentage: 20, hasDiscount: true },
    } as unknown as ProductDTO;

    expect(normalizeProduct(conflicting).discountPercentage).toBe(30);
  });

  test("no discount anywhere leaves the signals undefined rather than 0/false", () => {
    const result = normalizeProduct(legacyProduct);

    expect(result.discountPercentage).toBeUndefined();
    expect(result.hasDiscount).toBeUndefined();
  });
});
