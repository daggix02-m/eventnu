import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserProfile, requireAdmin, requireUser } from "./helpers";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getUserProfile(ctx);
  },
});

export const getById = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get("profiles", args.profileId);
  },
});

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").take(200);
    if (args.search) {
      const q = args.search.toLowerCase();
      return profiles.filter(
        (p) =>
          (p.fullName && p.fullName.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)),
      );
    }
    return profiles;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("profiles").take(1000);
    return {
      total: profiles.length,
      suspended: profiles.filter((p) => p.suspended).length,
      admins: profiles.filter((p) => p.role === "admin").length,
    };
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx);
    if (profile.role !== "admin" && profile._id !== args.profileId) {
      throw new Error("Not authorized");
    }
    const { profileId, ...fields } = args;
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch("profiles", profileId, updates);
  },
});

export const suspend = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch("profiles", args.profileId, { suspended: true });
  },
});

export const unsuspend = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch("profiles", args.profileId, { suspended: false });
  },
});

export const getUserWithCounts = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await ctx.db.get("profiles", args.profileId);
    if (!profile) return null;

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.profileId))
      .take(500);
    const likes = await ctx.db
      .query("eventLikes")
      .withIndex("by_user", (q) => q.eq("userId", args.profileId))
      .take(500);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.profileId))
      .take(500);
    const allComments = await ctx.db.query("eventComments").take(1000);
    const comments = allComments.filter((c) => c.userId === args.profileId);

    return {
      ...profile,
      eventCount: events.length,
      likeCount: likes.length,
      followCount: follows.length,
      commentCount: comments.length,
    };
  },
});
