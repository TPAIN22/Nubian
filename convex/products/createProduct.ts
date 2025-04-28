// convex/products/createProduct.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("products", {
      ...args,
    });
  },
});
