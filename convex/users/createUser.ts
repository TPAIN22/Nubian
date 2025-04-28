import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args:{
    username: v.string(),
    email: v.string(),
    image_url: v.string(),
    first_name: v.string(),
    isAdmin: v.boolean(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (existingUser) return;

    await ctx.db.insert("users", {
      username: args.username,
      email: args.email,
      image_url: args.image_url,
      first_name: args.first_name,
      isAdmin: args.isAdmin,
      clerkId: args.clerkId,
    });
  },
});
