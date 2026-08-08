import { query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const getNavCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [pendingEvents, openReports] = await Promise.all([
      ctx.db
        .query("events")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .take(1000),
      ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .take(1000),
    ]);
    return {
      pendingReview: pendingEvents.length,
      openReports: openReports.length,
    };
  },
});
