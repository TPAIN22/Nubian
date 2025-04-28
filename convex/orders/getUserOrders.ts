import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUserOrders = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const productsWithDetails = await Promise.all(
          order.products.map(async (item) => {
            const product = await ctx.db.get(item.productId as any); 
            return {
              ...item,
              product, 
            };
          })
        );
        return {
          ...order,
          products: productsWithDetails, 
        };
      })
    );

    return ordersWithProducts;
  },
});
