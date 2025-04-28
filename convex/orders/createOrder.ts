import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";


export const createOrder = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    let total = 0;
    for (const item of cartItems) {
        const product = await ctx.db.get(item.productId as Id<"products">);
        if (!product) continue;
      total += product.price * item.quantity;
    }

    const orderProducts = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await ctx.db.insert("orders", {
      userId: args.userId,
      products: orderProducts,
      total,
      status: "pending",
    });

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }
  },
});
