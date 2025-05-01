import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUserCart = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return cartItems;
  },
});
