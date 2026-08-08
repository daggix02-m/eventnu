import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./helpers";
import { rateLimiter } from "./rateLimiter";

export const listByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("eventComments")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .take(200);
    const enriched = await Promise.all(
      comments.map(async (c) => {
        const profile = await ctx.db.get("profiles", c.userId);
        return {
          ...c,
          user: profile ? { fullName: profile.fullName, avatarUrl: profile.avatarUrl } : null,
        };
      }),
    );
    return enriched.filter((c) => !c.isDeleted);
  },
});

export const create = mutation({
  args: {
    eventId: v.id("events"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx);
    await rateLimiter.limit(ctx, "commentCreate", { key: profile._id, throws: true });
    return await ctx.db.insert("eventComments", {
      eventId: args.eventId,
      userId: profile._id,
      content: args.content,
      isDeleted: false,
    });
  },
});

export const remove = mutation({
  args: { commentId: v.id("eventComments") },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx);
    const comment = await ctx.db.get("eventComments", args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== profile._id && profile.role !== "admin") {
      throw new Error("Not authorized");
    }
    await ctx.db.patch("eventComments", args.commentId, { isDeleted: true });
  },
});
