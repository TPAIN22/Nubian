import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Please log in first");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Only admins can delete products");
    }

    await ctx.db.delete(args.productId);
  },
});
