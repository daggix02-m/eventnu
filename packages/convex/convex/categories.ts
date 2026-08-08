import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const getRoot = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("parentId"), undefined))
      .order("asc")
      .take(100);
    return categories.filter((c) => !c.parentId);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").order("asc").take(100);
  },
});

export const getWithEventCounts = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").take(100);
    const published = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(500);
    const publishedIds = new Set(published.map((e) => e._id));
    return await Promise.all(
      categories.map(async (cat) => {
        const rows = await ctx.db
          .query("eventCategories")
          .withIndex("by_category", (q) => q.eq("categoryId", cat._id))
          .take(500);
        return {
          ...cat,
          eventCount: rows.filter((r) => publishedIds.has(r.eventId)).length,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description ?? undefined,
      icon: args.icon ?? undefined,
      parentId: args.parentId ?? undefined,
      sortOrder: args.sortOrder ?? 0,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { categoryId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch("categories", categoryId, updates);
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete("categories", args.categoryId);
  },
});

export const reorder = mutation({
  args: {
    categoryIds: v.array(v.id("categories")),
    startOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const startOrder = args.startOrder ?? 0;
    for (let i = 0; i < args.categoryIds.length; i++) {
      await ctx.db.patch("categories", args.categoryIds[i], {
        sortOrder: startOrder + i,
      });
    }
  },
});
