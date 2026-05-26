import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const getByShortCode = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .unique();
  },
});

export const getByOwnerId = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("boards")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .first();
  },
});

export const create = mutation({
  args: {
    ownerId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("boards")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", args.ownerId))
      .first();
    if (existing) return existing._id;

    let shortCode = generateShortCode();
    let collision = await ctx.db
      .query("boards")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", shortCode))
      .unique();
    while (collision) {
      shortCode = generateShortCode();
      collision = await ctx.db
        .query("boards")
        .withIndex("by_shortCode", (q) => q.eq("shortCode", shortCode))
        .unique();
    }

    return await ctx.db.insert("boards", {
      ownerId: args.ownerId,
      shortCode,
      name: args.name,
    });
  },
});
