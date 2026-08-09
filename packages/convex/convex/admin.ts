import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";
import type { Id, TableNames } from "./_generated/dataModel";

const ALL_TABLES: TableNames[] = [
  "users",
  "authSessions",
  "authAccounts",
  "authRefreshTokens",
  "authVerificationCodes",
  "authVerifiers",
  "authRateLimits",
  "profiles",
  "events",
  "eventCategories",
  "eventImages",
  "categories",
  "hosts",
  "organizerProfiles",
  "eventLikes",
  "eventComments",
  "follows",
  "pages",
  "announcements",
  "contactSubmissions",
  "notifications",
  "reports",
  "moderationLogs",
  "reservationRequests",
  "featuredSections",
  "supportTickets",
  "adminSettings",
  "instagramConnections",
  "instagramConnectStates",
  "instagramSyncLogs",
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateBootstrapKey(key: string): void {
  if (!process.env.ADMIN_BOOTSTRAP_KEY || key !== process.env.ADMIN_BOOTSTRAP_KEY) {
    throw new Error("Invalid bootstrap key");
  }
}

export const createAdminUser = action({
  args: { email: v.string(), password: v.string(), name: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    validateBootstrapKey(args.key);

    const admins = await ctx.runQuery(internal.instagram.listAdmins);
    if (admins.length > 0) {
      throw new Error("An admin already exists. Admin creation is bootstrap-only.");
    }

    const email = normalizeEmail(args.email);
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.password },
      profile: { email, name: args.name },
    });

    await ctx.runMutation(internal.admin.createAdminProfile, {
      authUserId: user._id,
      email,
      fullName: args.name,
    });

    return { userId: user._id };
  },
});

export const createAdminProfile = internalMutation({
  args: {
    authUserId: v.id("users"),
    email: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const byUser = await ctx.db
      .query("profiles")
      .withIndex("by_auth_user", (q) => q.eq("authUserId", args.authUserId))
      .first();
    if (byUser) throw new Error("A profile already exists for this account");

    const byEmail = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (byEmail) throw new Error("A profile already exists for this email");

    return await ctx.db.insert("profiles", {
      authUserId: args.authUserId,
      role: "admin",
      fullName: args.fullName,
      email: args.email,
      suspended: false,
    });
  },
});

export const wipeDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deleted: Record<string, number> = {};
    for (const table of ALL_TABLES) {
      let count = 0;
      for (;;) {
        const docs = await ctx.db.query(table).take(1000);
        if (docs.length === 0) break;
        for (const doc of docs) await ctx.db.delete(table, doc._id);
        count += docs.length;
      }
      deleted[table] = count;
    }
    return deleted;
  },
});

export const resetAdmins = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
    key: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ deleted: Record<string, number>; adminProfileId: Id<"profiles">; email: string }> => {
    validateBootstrapKey(args.key);

    const deleted: Record<string, number> = await ctx.runMutation(internal.admin.wipeDatabase, {});

    const email = normalizeEmail(args.email);
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.password },
      profile: { email, name: args.name },
    });

    const adminProfileId: Id<"profiles"> = await ctx.runMutation(internal.admin.createAdminProfile, {
      authUserId: user._id,
      email,
      fullName: args.name,
    });

    return { deleted, adminProfileId, email };
  },
});
