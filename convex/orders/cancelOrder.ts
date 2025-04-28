import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "canceled") {
      throw new Error("Order is already canceled");
    }

    await ctx.db.patch(args.orderId, {
      status: "canceled",
    });

    return { message: "Order has been canceled" };
  },
});
