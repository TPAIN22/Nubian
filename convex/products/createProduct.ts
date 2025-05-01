import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    category: v.string(),
    inStock: v.optional(v.boolean()), 
    ownerId: v.optional(v.string()), 
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

    const imagesArray = args.images;
    if (imagesArray.length < 4) {
      throw new Error("يجب رفع أربع صور على الأقل للمنتج.");
    }
    await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      images: imagesArray,
      category: args.category,
      inStock: args.inStock,
      ownerId: identity.subject,
    });
  },
});
