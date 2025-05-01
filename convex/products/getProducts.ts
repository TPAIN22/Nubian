import { query } from "../_generated/server";
import { v } from "convex/values";

export const getProducts = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("products");

    if (args.category) {
      query.filter((q) => q.eq("category", args.category));
    }

    const products = await query.collect();
    return products;
  },
});
