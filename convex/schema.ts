import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    ownerId: v.string(),
    shortCode: v.string(),
    name: v.string(),
  }).index("by_shortCode", ["shortCode"])
    .index("by_ownerId", ["ownerId"]),

  links: defineTable({
    boardId: v.id("boards"),
    url: v.string(),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    category: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.union(v.literal("categorizing"), v.literal("done"), v.literal("error")),
    createdAt: v.number(),
  }).index("by_boardId", ["boardId"]),
});
