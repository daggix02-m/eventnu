import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getUserProfile, requireUser } from "./helpers";
import { enrichEvent } from "./events";
import { rateLimiter } from "./rateLimiter";

export const countByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get("events", args.eventId);
    return event?.bookmarkCount ?? 0;
  },
});

export const hasBookmarked = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx);
    if (!profile) return false;
    const bookmark = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", profile._id).eq("eventId", args.eventId),
      )
      .first();
    return !!bookmark;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx);
    const bookmarks = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_user", (q) => q.eq("userId", profile._id))
      .order("desc")
      .take(200);
    const events = await Promise.all(
      bookmarks.map((b) => ctx.db.get("events", b.eventId)),
    );
    const enriched = await Promise.all(
      events
        .filter((e): e is Doc<"events"> => !!e && e.status === "published")
        .map((e) => enrichEvent(ctx, e)),
    );
    return enriched;
  },
});

export const toggle = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx);
    const userId = profile._id;
    await rateLimiter.limit(ctx, "bookmarkToggle", { key: userId, throws: true });

    const event = await ctx.db.get("events", args.eventId);
    if (!event) throw new Error("Event not found");

    const existing = await ctx.db
      .query("eventBookmarks")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", args.eventId),
      )
      .first();
    if (existing) {
      await ctx.db.delete("eventBookmarks", existing._id);
      await ctx.db.patch("events", args.eventId, {
        bookmarkCount: Math.max(0, (event.bookmarkCount ?? 0) - 1),
      });
      return false;
    } else {
      await ctx.db.insert("eventBookmarks", {
        userId,
        eventId: args.eventId,
      });
      await ctx.db.patch("events", args.eventId, {
        bookmarkCount: (event.bookmarkCount ?? 0) + 1,
      });
      return true;
    }
  },
});
