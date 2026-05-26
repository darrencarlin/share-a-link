import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const CATEGORIES = [
  "article",
  "blog",
  "news",
  "video",
  "podcast",
  "music",
  "tool",
  "app",
  "library",
  "framework",
  "api",
  "documentation",
  "tutorial",
  "course",
  "book",
  "research",
  "paper",
  "reference",
  "social",
  "forum",
  "community",
  "shopping",
  "product",
  "deal",
  "entertainment",
  "game",
  "meme",
  "humor",
  "design",
  "inspiration",
  "portfolio",
  "startup",
  "business",
  "finance",
  "crypto",
  "ai",
  "machine-learning",
  "data-science",
  "devops",
  "security",
  "open-source",
  "job",
  "career",
  "event",
  "conference",
  "recipe",
  "health",
  "fitness",
  "travel",
  "science",
  "space",
  "politics",
  "environment",
  "education",
  "photography",
  "other",
] as const;

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    boardId: v.id("boards"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const linkId = await ctx.db.insert("links", {
      boardId: args.boardId,
      url: args.url,
      status: "categorizing",
      createdAt: Date.now(),
    });
    return linkId;
  },
});

export const remove = mutation({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateWithMetadata = internalMutation({
  args: {
    linkId: v.id("links"),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    category: v.string(),
    summary: v.string(),
    status: v.union(v.literal("done"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const { linkId, ...fields } = args;
    await ctx.db.patch(linkId, fields);
  },
});

export const categorize = action({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const link = await ctx.runQuery(internal.links.getById, { id: args.linkId });
    if (!link) return;

    let ogTitle: string | undefined;
    let ogDescription: string | undefined;
    let ogImage: string | undefined;

    try {
      const response = await fetch(link.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkBot/1.0)" },
        redirect: "follow",
      });
      const html = await response.text();

      ogTitle =
        html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[ 1] ??
        html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/)?.[ 1] ??
        html.match(/<title[^>]*>([^<]*)<\/title>/)?.[ 1];
      ogDescription =
        html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[ 1] ??
        html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/)?.[ 1] ??
        html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[ 1];
      ogImage =
        html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/)?.[ 1] ??
        html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/)?.[ 1];
    } catch (e) {
      console.error("OG fetch failed:", e);
    }

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

      const prompt = `Categorize this link and write a one-sentence summary.

URL: ${link.url}
${ogTitle ? `Title: ${ogTitle}` : ""}
${ogDescription ? `Description: ${ogDescription}` : ""}

Categories (pick exactly one): ${CATEGORIES.join(", ")}

Respond with ONLY valid JSON, no markdown, no code fences:
{"category": "<category>", "summary": "<one sentence summary>"}`;

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`Anthropic API error ${aiResponse.status}: ${errorText}`);
      }

      const aiData = await aiResponse.json() as {
        content: Array<{ type: string; text: string }>;
      };
      const text = aiData.content[0].text.trim();
      const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(jsonStr) as { category: string; summary: string };

      await ctx.runMutation(internal.links.updateWithMetadata, {
        linkId: args.linkId,
        ogTitle,
        ogDescription,
        ogImage,
        category: parsed.category,
        summary: parsed.summary,
        status: "done",
      });
    } catch (e) {
      console.error("Categorization failed:", e);
      await ctx.runMutation(internal.links.updateWithMetadata, {
        linkId: args.linkId,
        ogTitle,
        ogDescription,
        ogImage,
        category: "other",
        summary: "Could not categorize this link",
        status: "error",
      });
    }
  },
});

export const getById = internalQuery({
  args: { id: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
