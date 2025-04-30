import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
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
      throw new Error("Unauthorized: Only admins can update products");
    }
    const imagesArray = args.images;
    if (imagesArray!.length < 4) {
      throw new Error("يجب رفع أربع صور على الأقل للمنتج.");
    }
    await ctx.db.patch(args.productId, {
      name: args.name,
      description: args.description,
      price: args.price,
      images: imagesArray,
      category: args.category,
      inStock: args.inStock,
    });
  },
});
