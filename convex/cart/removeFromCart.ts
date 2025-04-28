import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const removeFromCart = mutation({
  args: {
    cartItemId: v.id("cartItems"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cartItemId);
  },
});
