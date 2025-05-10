// getToken.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getToken = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("tokens")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    return token?.token ?? null;
  },
});
