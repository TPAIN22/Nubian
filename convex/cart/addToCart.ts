import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const addToCart = mutation({
  args: {
    userId: v.string(),
    productId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const existingCartItem = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    if (existingCartItem) {
      await ctx.db.patch(existingCartItem._id, {
        quantity: existingCartItem.quantity + args.quantity,
      });
    } else {
      await ctx.db.insert("cartItems", {
        userId: args.userId,
        productId: args.productId,
        quantity: args.quantity,
      });
    }
  },
});
