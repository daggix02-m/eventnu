import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const events = await ctx.db.query("events").take(1000);
    const profiles = await ctx.db.query("profiles").take(1000);
    const hosts = await ctx.db.query("hosts").take(500);
    const organizerProfiles = await ctx.db
      .query("organizerProfiles")
      .take(500);
    const reports = await ctx.db.query("reports").take(500);
    const moderationLogs = await ctx.db.query("moderationLogs").take(500);

    return {
      totalEvents: events.length,
      totalUsers: profiles.length,
      totalHosts: hosts.length,
      totalOrganizers: organizerProfiles.length,
      totalReports: reports.length,
      totalModerationLogs: moderationLogs.length,
    };
  },
});

export const getWeekly = query({
  args: { weeks: v.optional(v.number()), now: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const weeks = args.weeks ?? 12;
    const now = args.now;
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const events = await ctx.db.query("events").take(2000);
    const profiles = await ctx.db.query("profiles").take(2000);

    const eventsPerWeek: { week: string; count: number }[] = [];
    const usersPerWeek: { week: string; count: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const start = now - (i + 1) * weekMs;
      const end = now - i * weekMs;
      const weekLabel = new Date(start).toISOString().slice(0, 7);

      eventsPerWeek.push({
        week: weekLabel,
        count: events.filter(
          (e) =>
            e._creationTime >= start && e._creationTime < end,
        ).length,
      });

      usersPerWeek.push({
        week: weekLabel,
        count: profiles.filter(
          (p) =>
            p._creationTime >= start && p._creationTime < end,
        ).length,
      });
    }

    return { eventsPerWeek, usersPerWeek };
  },
});

export const getTopEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = args.limit ?? 10;
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .take(200);
    return events
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      .slice(0, limit);
  },
});
