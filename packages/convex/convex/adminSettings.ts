import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const getByAdmin = query({
  args: { adminId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("adminSettings")
      .withIndex("by_admin", (q) => q.eq("adminId", args.adminId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    adminId: v.id("profiles"),
    emailReports: v.boolean(),
    emailEvents: v.boolean(),
    emailUsers: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("adminSettings")
      .withIndex("by_admin", (q) => q.eq("adminId", args.adminId))
      .first();
    const fields = {
      emailReports: args.emailReports,
      emailEvents: args.emailEvents,
      emailUsers: args.emailUsers,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    const id = await ctx.db.insert("adminSettings", { adminId: args.adminId, ...fields });
    return id;
  },
});
