import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const backfillEventCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("events").take(1000);
    for (const event of events) {
      const legacy = (event as unknown as { categoryIds?: Id<"categories">[] }).categoryIds;
      if (legacy && legacy.length > 0) {
        const existing = await ctx.db
          .query("eventCategories")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .first();
        if (!existing) {
          for (const [i, categoryId] of legacy.entries()) {
            await ctx.db.insert("eventCategories", {
              eventId: event._id,
              categoryId,
              isPrimary: i === 0,
            });
          }
        }
      }
      const reservations = await ctx.db
        .query("reservationRequests")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .take(500);
      const current = (event as unknown as { reservationCount?: number }).reservationCount ?? 0;
      if (current !== reservations.length) {
        await ctx.db.patch("events", event._id, {
          reservationCount: reservations.length,
        });
      }
    }
    return { processed: events.length };
  },
});
