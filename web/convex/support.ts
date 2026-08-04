import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_admin", (q) => q.eq("adminId", admin._id))
      .order("desc")
      .take(100);
  },
});

export const getById = query({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get("supportTickets", args.ticketId);
  },
});

export const create = mutation({
  args: {
    subject: v.string(),
    message: v.string(),
    priority: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db.insert("supportTickets", {
      adminId: admin._id,
      subject: args.subject,
      message: args.message,
      priority: args.priority,
      status: "open",
    });
  },
});

export const close = mutation({
  args: { ticketId: v.id("supportTickets") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch("supportTickets", args.ticketId, { status: "closed" });
  },
});
