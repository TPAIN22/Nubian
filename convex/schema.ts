import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    category: v.string(),
    inStock: v.optional(v.boolean()), 
    ownerId: v.optional(v.string()), 
  }),
  tokens: defineTable({
    userId: v.string(),
    token: v.string(),
  }).index("by_user", ["userId"]),

  users: defineTable({
    username: v.string(),
    email: v.string(),
    image_url: v.string(),
    first_name: v.string(),
    isAdmin:v.boolean(),
    clerkId:v.string(),
  })
  .index("by_clerkId", ["clerkId"]),

  cartItems: defineTable({
    userId: v.string(),
    productId: v.string(),
    quantity: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_product", ["productId"]),

  orders: defineTable({
    userId: v.string(),
    products: v.array(
      v.object({
        productId: v.string(),
        quantity: v.number(),
      })
    ),
    total: v.number(),
    status: v.optional(v.string()),
  })
  .index("by_user", ["userId"]),
});
