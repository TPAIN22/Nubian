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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Please log in first");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized: Only admins can create products");
    }

    await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      imageUrl: args.imageUrl,
      category: args.category,
      inStock: args.inStock ?? true,
      ownerId: identity.subject,
    });
  },
});
