import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const logs = await ctx.db
      .query("moderationLogs")
      .order("desc")
      .take(100);
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db.get("profiles", log.adminId);
        return { ...log, adminName: admin?.fullName ?? "Unknown" };
      }),
    );
    return enriched;
  },
});

export const logModerationAction = mutation({
  args: {
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.insert("moderationLogs", {
      adminId: admin._id,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      note: args.note ?? undefined,
    });
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 20;
    const logs = await ctx.db
      .query("moderationLogs")
      .order("desc")
      .take(limit);
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db.get("profiles", log.adminId);
        return { ...log, adminName: admin?.fullName ?? "Unknown" };
      }),
    );
    return enriched;
  },
});

export const getByTarget = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const logs = await ctx.db
      .query("moderationLogs")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .order("desc")
      .take(100);
    const enriched = await Promise.all(
      logs.map(async (log) => {
        const admin = await ctx.db.get("profiles", log.adminId);
        return { ...log, adminName: admin?.fullName ?? "Unknown" };
      }),
    );
    return enriched;
  },
});
