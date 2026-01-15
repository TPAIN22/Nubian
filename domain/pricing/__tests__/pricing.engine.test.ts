import { resolvePrice } from "../pricing.engine";
import { NormalizedProduct } from "../../product/product.normalize";

describe("Pricing Engine - resolvePrice", () => {
  const simpleProduct: NormalizedProduct = {
    id: "1",
    name: "Simple Item",
    description: "desc",
    isActive: true,
    deletedAt: null,
    categoryId: "cat1",
    merchantId: "merch1",
    images: [],
    attributeDefs: [],
    variants: [],
    simple: {
      stock: 10,
      merchantPrice: 1000,
      finalPrice: 1100,
      nubianMarkup: 10,
      dynamicMarkup: 0,
    },
    productLevelPricing: {
      merchantPrice: 1000,
      finalPrice: 1100,
    },
  };

  const variantProduct: NormalizedProduct = {
    id: "2",
    name: "Variant Item",
    description: "desc",
    isActive: true,
    deletedAt: null,
    categoryId: "cat1",
    merchantId: "merch1",
    images: [],
    attributeDefs: [
      { _id: "attr1", name: "size", displayName: "Size", options: ["M", "L"], required: true }
    ],
    variants: [
      {
        _id: "v1",
        sku: "SKU-M",
        attributes: { size: "M" },
        merchantPrice: 2000,
        price: 2000,
        finalPrice: 2200,
        stock: 5,
        isActive: true,
        nubianMarkup: 10,
        dynamicMarkup: 0,
      },
      {
        _id: "v2",
        sku: "SKU-L",
        attributes: { size: "L" },
        merchantPrice: 2500,
        price: 2500,
        finalPrice: 2750,
        stock: 0,
        isActive: true,
        nubianMarkup: 10,
        dynamicMarkup: 0,
      }
    ],
    simple: {
      stock: null,
      merchantPrice: null,
      finalPrice: null,
      nubianMarkup: null,
      dynamicMarkup: null,
    },
    productLevelPricing: {
      merchantPrice: 2000,
      finalPrice: 2200,
    },
  };

  test("should resolve simple product pricing correctly", () => {
    const result = resolvePrice({ product: simpleProduct });
    expect(result.final).toBe(1100);
    expect(result.merchant).toBe(1000);
    expect(result.requiresSelection).toBe(false);
    expect(result.source).toBe("simple");
  });

  test("should require selection for variant product when no variant selected", () => {
    const result = resolvePrice({ product: variantProduct });
    expect(result.requiresSelection).toBe(true);
    expect(result.source).toBe("variant");
    expect(result.final).toBe(2200); // From productLevelPricing
  });

  test("should resolve variant pricing when variant is selected", () => {
    const result = resolvePrice({ 
      product: variantProduct, 
      selectedVariant: variantProduct.variants[1] 
    });
    expect(result.final).toBe(2750);
    expect(result.merchant).toBe(2500);
    expect(result.requiresSelection).toBe(false);
    expect(result.source).toBe("variant");
  });
});
