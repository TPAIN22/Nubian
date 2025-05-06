import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

export const getUserCart = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const detailedCart = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ctx.db.get(item.productId as Id<"products">);
        return {
          ...item,
          product,
        };
      })
    );

    return detailedCart;
  },
});

