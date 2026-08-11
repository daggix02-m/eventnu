import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserProfile, requireAdmin, requireUser } from "./helpers";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const USER_STATUS = v.union(
  v.literal("all"),
  v.literal("active"),
  v.literal("suspended"),
  v.literal("no_profile"),
);

function toUserRow(user: Doc<"users">, profile: Doc<"profiles"> | null | undefined) {
  return {
    authUserId: user._id,
    email: user.email ?? "",
    name: user.name ?? null,
    image: user.image ?? null,
    profileId: profile?._id ?? null,
    role: profile?.role ?? "user",
    fullName: profile?.fullName ?? user.name ?? null,
    avatarUrl: profile?.avatarUrl ?? user.image ?? null,
    suspended: profile?.suspended ?? false,
    hasProfile: !!profile,
    created_at: user._creationTime,
  };
}

async function getProfileByAuthUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"profiles"> | null> {
  return await ctx.db
    .query("profiles")
    .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
    .first();
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getUserProfile(ctx);
  },
});

export const ensureProfile = mutation({
  args: { fullName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
      .first();
    if (existing) return { id: existing._id, created: false };

    const user = await ctx.db.get("users", userId);
    const email = user?.email;
    if (!email) throw new Error("Account has no email");

    const byEmail = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (byEmail) {
      await ctx.db.patch("profiles", byEmail._id, { authUserId: userId });
      return { id: byEmail._id, created: false };
    }

    const id = await ctx.db.insert("profiles", {
      authUserId: userId,
      role: "user",
      fullName: args.fullName ?? user.name ?? undefined,
      email,
      suspended: false,
    });
    return { id, created: true };
  },
});

export const acceptTerms = mutation({
  args: { version: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx);
    await ctx.db.patch("profiles", profile._id, {
      acceptedTermsAt: Date.now(),
      acceptedTermsVersion: args.version,
    });
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

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(USER_STATUS),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").take(1000);
    const profiles = await ctx.db.query("profiles").take(1000);
    const profileByAuth = new Map(
      profiles
        .filter((p) => p.authUserId !== undefined)
        .map((p) => [p.authUserId as Id<"users">, p] as const),
    );

    let rows = users.map((user) => toUserRow(user, profileByAuth.get(user._id)));

    if (args.status === "active") {
      rows = rows.filter((r) => r.hasProfile && !r.suspended);
    } else if (args.status === "suspended") {
      rows = rows.filter((r) => r.hasProfile && r.suspended);
    } else if (args.status === "no_profile") {
      rows = rows.filter((r) => !r.hasProfile);
    }

    if (args.search) {
      const q = args.search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.email.toLowerCase().includes(q) ||
          (r.fullName ?? "").toLowerCase().includes(q) ||
          (r.name ?? "").toLowerCase().includes(q),
      );
    }

    return rows;
  },
});

export const getUserByAuthId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get("users", args.userId);
    if (!user) return null;
    const profile = await getProfileByAuthUserId(ctx, user._id);
    return toUserRow(user, profile);
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
    const admin = await requireAdmin(ctx);
    if (admin._id === args.profileId) {
      throw new Error("You cannot suspend your own account");
    }
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

export const setUserSuspended = mutation({
  args: { userId: v.id("users"), suspended: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (args.suspended && admin.authUserId === args.userId) {
      throw new Error("You cannot suspend your own account");
    }

    const user = await ctx.db.get("users", args.userId);
    if (!user) throw new Error("User not found");

    const profile = await getProfileByAuthUserId(ctx, args.userId);
    if (profile) {
      await ctx.db.patch("profiles", profile._id, { suspended: args.suspended });
      return;
    }

    const byEmail = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("email"), user.email ?? ""))
      .first();
    if (byEmail) {
      await ctx.db.patch("profiles", byEmail._id, {
        authUserId: args.userId,
        suspended: args.suspended,
      });
      return;
    }

    await ctx.db.insert("profiles", {
      authUserId: args.userId,
      role: "user",
      fullName: user.name ?? undefined,
      email: user.email ?? undefined,
      suspended: args.suspended,
    });
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (admin.authUserId === args.userId && args.role !== "admin") {
      throw new Error("You cannot demote your own account");
    }

    const profile = await getProfileByAuthUserId(ctx, args.userId);
    if (!profile) throw new Error("User has no profile yet");
    await ctx.db.patch("profiles", profile._id, { role: args.role });
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
