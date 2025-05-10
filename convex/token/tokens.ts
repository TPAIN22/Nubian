import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createToken = mutation({
    args: {
        userId: v.string(),
        token: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("tokens", args);
    },
});