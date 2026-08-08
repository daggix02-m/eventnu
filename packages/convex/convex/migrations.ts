import { mutation } from "./_generated/server";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireAdmin } from "./helpers";

function eventTime(y: number, m: number, d: number, h: number, min: number): number {
  return Date.UTC(y, m - 1, d, h, min) - 3 * 60 * 60 * 1000;
}

export const setEventTimes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const patches: {
      slug: string;
      startDate: number;
      endDate: number;
      venueName?: string;
      venueAddress?: string;
      priceDisplay?: string;
    }[] = [
      { slug: "shift", startDate: eventTime(2026, 6, 27, 19, 0), endDate: eventTime(2026, 6, 27, 21, 0), venueName: "Social Addis", venueAddress: "Bole Atlas" },
      { slug: "urban-friends", startDate: eventTime(2026, 6, 26, 10, 0), endDate: eventTime(2026, 6, 28, 19, 0), venueName: "Nile Source Building", venueAddress: "In front of Ramada Hotel, Bole" },
      { slug: "cycle-session", startDate: eventTime(2026, 6, 26, 17, 0), endDate: eventTime(2026, 6, 26, 23, 59), venueName: "Meskel Square", venueAddress: "Addis Ababa" },
      { slug: "tea-gathering", startDate: eventTime(2026, 6, 26, 16, 0), endDate: eventTime(2026, 6, 26, 23, 59), venueName: "Asewi Cafe, Gym & Spa" },
      { slug: "wegdayt", startDate: eventTime(2026, 6, 27, 0, 0), endDate: eventTime(2026, 6, 27, 23, 59), venueName: "Venue Warehouse" },
      { slug: "voice-live", startDate: eventTime(2026, 7, 3, 19, 0), endDate: eventTime(2026, 7, 3, 23, 59), venueName: "Alliance Ethio-Française", priceDisplay: "Free" },
      { slug: "utopia-night", startDate: eventTime(2026, 7, 4, 0, 0), endDate: eventTime(2026, 7, 4, 23, 59), venueName: "Velvet Rooftop", priceDisplay: "1199" },
      { slug: "afro-heat", startDate: eventTime(2026, 7, 4, 0, 0), endDate: eventTime(2026, 7, 4, 23, 59), venueName: "Third Wave" },
      { slug: "sip-paint", startDate: eventTime(2026, 7, 4, 0, 0), endDate: eventTime(2026, 7, 4, 23, 59), venueName: "Bliss Coffee & Ice Cream" },
      { slug: "jampiano", startDate: eventTime(2026, 7, 4, 23, 0), endDate: eventTime(2026, 7, 4, 23, 59), venueName: "Luxx Ignite", venueAddress: "Bole Atlas" },
      { slug: "adventure-run", startDate: eventTime(2026, 7, 5, 7, 0), endDate: eventTime(2026, 7, 5, 23, 59), venueName: "Gullele Botanical Garden", priceDisplay: "1,800" },
      { slug: "unity-in-beats", startDate: eventTime(2026, 7, 18, 18, 0), endDate: eventTime(2026, 7, 19, 3, 0), venueName: "Venue Warehouse" },
      { slug: "networking-night", startDate: eventTime(2026, 7, 18, 18, 0), endDate: eventTime(2026, 7, 18, 23, 59), venueName: "The Alchemist", venueAddress: "Bole Rwanda", priceDisplay: "700" },
      { slug: "ertib", startDate: eventTime(2026, 7, 18, 0, 0), endDate: eventTime(2026, 7, 18, 23, 59), priceDisplay: "300" },
      { slug: "night-shift", startDate: eventTime(2026, 7, 25, 0, 0), endDate: eventTime(2026, 7, 25, 23, 59), priceDisplay: "400 / 500 / 600" },
      { slug: "bloom-week", startDate: eventTime(2026, 7, 24, 10, 0), endDate: eventTime(2026, 7, 26, 21, 0), venueName: "Nile Source Building", venueAddress: "In front of Ramada Hotel, Bole" },
    ];

    let updated = 0;
    let missing = 0;
    for (const p of patches) {
      const event = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", p.slug))
        .unique();
      if (!event) {
        missing += 1;
        continue;
      }
      await ctx.db.patch("events", event._id, {
        startDate: p.startDate,
        endDate: p.endDate,
        venueName: p.venueName ?? event.venueName,
        venueAddress: p.venueAddress ?? event.venueAddress,
        priceDisplay: p.priceDisplay ?? event.priceDisplay,
      });
      updated += 1;
    }
    return { updated, missing };
  },
});

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
