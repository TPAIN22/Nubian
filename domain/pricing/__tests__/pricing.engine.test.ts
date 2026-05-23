import { resolvePrice, getDisplayPrice } from "../pricing.engine";
import { NormalizedProduct, ProductVariantDTO } from "../../product/product.normalize";

/* ================= FIXTURE BUILDERS ================= */

const makeProduct = (overrides: Partial<NormalizedProduct> = {}): NormalizedProduct => ({
  id: "p1",
  name: "Product",
  description: "desc",
  isActive: true,
  dynamicPricingEnabled: false,
  deletedAt: null,
  categoryId: "cat1",
  merchantId: "merch1",
  images: [],
  attributeDefs: [],
  variants: [],
  simple: {
    stock: 10,
    merchantPrice: null,
    finalPrice: null,
    nubianMarkup: null,
    dynamicMarkup: null,
    discountPrice: null,
  },
  productLevelPricing: {
    merchantPrice: null,
    finalPrice: null,
    nubianMarkup: null,
    dynamicMarkup: null,
    discountPrice: null,
  },
  ...overrides,
});

const makeVariant = (overrides: Partial<ProductVariantDTO> = {}): ProductVariantDTO => ({
  _id: "v1",
  sku: "SKU",
  attributes: {},
  merchantPrice: 0,
  price: 0,
  stock: 0,
  isActive: true,
  ...overrides,
});

/* ================= resolvePrice — definitive (backend-enriched) ================= */

describe("resolvePrice — definitive backend pricing", () => {
  test("resolves a simple product from its enriched finalPrice", () => {
    const product = makeProduct({
      simple: {
        stock: 10,
        merchantPrice: 1000,
        finalPrice: 1100,
        nubianMarkup: 10,
        dynamicMarkup: 0,
        discountPrice: null,
      },
    });

    const result = resolvePrice({ product });
    expect(result.final).toBe(1100);
    expect(result.merchant).toBe(1000);
    expect(result.requiresSelection).toBe(false);
    expect(result.source).toBe("simple");
  });

  test("variant product with no selection reports a definitive 'from' price", () => {
    const product = makeProduct({
      attributeDefs: [
        { _id: "attr1", name: "size", displayName: "Size", options: ["M", "L"], required: true },
      ],
      variants: [
        makeVariant({ _id: "v1", sku: "SKU-M", attributes: { size: "M" }, merchantPrice: 2000, price: 2000, finalPrice: 2200, stock: 5 }),
        makeVariant({ _id: "v2", sku: "SKU-L", attributes: { size: "L" }, merchantPrice: 2500, price: 2500, finalPrice: 2750, stock: 0 }),
      ],
      productLevelPricing: { merchantPrice: 2000, finalPrice: 2200, nubianMarkup: 10, dynamicMarkup: 0, discountPrice: null },
    });

    const result = resolvePrice({ product });
    expect(result.requiresSelection).toBe(true);
    // A present productLevelPricing.finalPrice is a backend-enriched root price,
    // so the engine reports it as "definitive" rather than "variant".
    expect(result.source).toBe("definitive");
    expect(result.final).toBe(2200);
  });

  test("resolves the selected variant's enriched finalPrice", () => {
    const product = makeProduct({
      variants: [
        makeVariant({ _id: "v1", merchantPrice: 2000, price: 2000, finalPrice: 2200, stock: 5 }),
        makeVariant({ _id: "v2", merchantPrice: 2500, price: 2500, finalPrice: 2750, stock: 3 }),
      ],
    });

    const result = resolvePrice({ product, selectedVariant: product.variants[1] });
    expect(result.final).toBe(2750);
    expect(result.merchant).toBe(2500);
    expect(result.requiresSelection).toBe(false);
    expect(result.source).toBe("variant");
  });

  test("computes a discount from root originalPrice / discountPercentage", () => {
    const product = makeProduct({
      simple: { stock: 10, merchantPrice: 1000, finalPrice: 1100, nubianMarkup: null, dynamicMarkup: null, discountPrice: null },
      originalPrice: 1500,
      discountPercentage: 27,
    });

    const result = resolvePrice({ product });
    expect(result.final).toBe(1100);
    expect(result.original).toBe(1500);
    expect(result.discount).toEqual({ amount: 400, percentage: 27 });
  });
});

/* ================= resolvePrice — legacy local fallback ================= */

describe("resolvePrice — legacy local fallback", () => {
  test("simple product without enriched price falls back to markup math", () => {
    const product = makeProduct({
      simple: { stock: 5, merchantPrice: 1000, finalPrice: null, nubianMarkup: 30, dynamicMarkup: 0, discountPrice: null },
    });

    const result = resolvePrice({ product });
    expect(result.final).toBe(1300); // 1000 * (1 + 30%)
    expect(result.merchant).toBe(1000);
    expect(result.source).toBe("simple");
    expect(result.requiresSelection).toBe(false);
    expect(result.discount).toBeUndefined();
    expect(result.breakdown?.nubianMarkup).toBe(30);
  });

  test("simple product applies a legacy discountPrice below the listed price", () => {
    const product = makeProduct({
      simple: { stock: 5, merchantPrice: 1000, finalPrice: null, nubianMarkup: 30, dynamicMarkup: 0, discountPrice: 1100 },
    });

    const result = resolvePrice({ product });
    expect(result.final).toBe(1100);
    expect(result.discount).toEqual({ amount: 200, percentage: 15 });
  });

  test("selected variant without enriched price falls back to markup math", () => {
    const variant = makeVariant({
      _id: "v1",
      merchantPrice: 2000,
      price: 2000,
      finalPrice: 0,
      stock: 5,
      nubianMarkup: 10,
      dynamicMarkup: 0,
    });
    const product = makeProduct({ variants: [variant] });

    const result = resolvePrice({ product, selectedVariant: variant });
    expect(result.final).toBe(2200); // 2000 * (1 + 10%)
    expect(result.merchant).toBe(2000);
    expect(result.source).toBe("variant");
    expect(result.requiresSelection).toBe(false);
  });

  test("variant product with no root price picks the cheapest active variant", () => {
    const product = makeProduct({
      variants: [
        makeVariant({ _id: "v1", merchantPrice: 2800, price: 2800, finalPrice: 3000, stock: 5 }),
        makeVariant({ _id: "v2", merchantPrice: 2300, price: 2300, finalPrice: 2500, stock: 3 }),
        makeVariant({ _id: "v3", merchantPrice: 1000, price: 1000, finalPrice: 1200, stock: 9, isActive: false }),
      ],
    });

    const result = resolvePrice({ product });
    // v3 is cheapest but inactive — it must be ignored.
    expect(result.final).toBe(2500);
    expect(result.merchant).toBe(2300);
    expect(result.source).toBe("variant");
    expect(result.requiresSelection).toBe(true);
  });

  test("variant product with no usable variant prices falls back to productLevelPricing", () => {
    const product = makeProduct({
      variants: [makeVariant({ _id: "v1", merchantPrice: 0, price: 0, finalPrice: 0, stock: 0 })],
      productLevelPricing: { merchantPrice: 1500, finalPrice: null, nubianMarkup: null, dynamicMarkup: null, discountPrice: null },
    });

    const result = resolvePrice({ product });
    expect(result.final).toBe(1950); // 1500 * (1 + default 30%)
    expect(result.merchant).toBe(1500);
    expect(result.source).toBe("variant");
    expect(result.requiresSelection).toBe(true);
  });
});

/* ================= getDisplayPrice ================= */

describe("getDisplayPrice", () => {
  test("variant product returns the root finalPrice as a 'from' price", () => {
    const product = makeProduct({
      variants: [makeVariant({ _id: "v1", merchantPrice: 2000, price: 2000, finalPrice: 2200, stock: 5 })],
      productLevelPricing: { merchantPrice: 2000, finalPrice: 2200, nubianMarkup: null, dynamicMarkup: null, discountPrice: null },
    });

    expect(getDisplayPrice(product)).toEqual({ price: 2200, isFrom: true });
  });

  test("variant product with no root price uses the cheapest variant price", () => {
    const product = makeProduct({
      variants: [
        makeVariant({ _id: "v1", merchantPrice: 2800, price: 2800, finalPrice: 3000, stock: 5 }),
        makeVariant({ _id: "v2", merchantPrice: 2300, price: 2300, finalPrice: 2500, stock: 3 }),
        makeVariant({ _id: "v3", merchantPrice: 100, price: 100, finalPrice: 200, stock: 1, isActive: false }),
      ],
    });

    expect(getDisplayPrice(product)).toEqual({ price: 2500, isFrom: true });
  });

  test("simple product returns its finalPrice", () => {
    const product = makeProduct({
      simple: { stock: 10, merchantPrice: 1000, finalPrice: 1100, nubianMarkup: null, dynamicMarkup: null, discountPrice: null },
    });

    expect(getDisplayPrice(product)).toEqual({ price: 1100, isFrom: false });
  });

  test("simple product with no finalPrice falls back to merchantPrice", () => {
    const product = makeProduct({
      simple: { stock: 10, merchantPrice: 900, finalPrice: null, nubianMarkup: null, dynamicMarkup: null, discountPrice: null },
    });

    expect(getDisplayPrice(product)).toEqual({ price: 900, isFrom: false });
  });
});
