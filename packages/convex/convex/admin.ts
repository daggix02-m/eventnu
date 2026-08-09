import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount } from "@convex-dev/auth/server";

export const createAdminUser = action({
  args: { email: v.string(), password: v.string(), name: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    if (!process.env.ADMIN_BOOTSTRAP_KEY || args.key !== process.env.ADMIN_BOOTSTRAP_KEY) {
      throw new Error("Invalid bootstrap key");
    }

    const admins = await ctx.runQuery(internal.instagram.listAdmins);
    if (admins.length > 0) {
      throw new Error("An admin already exists. Admin creation is bootstrap-only.");
    }

    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.password },
      profile: { email: args.email, name: args.name },
    });

    await ctx.runMutation(internal.admin.createAdminProfile, {
      authUserId: user._id,
      email: args.email,
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
    await ctx.db.insert("profiles", {
      authUserId: args.authUserId,
      role: "admin",
      fullName: args.fullName,
      email: args.email,
      suspended: false,
    });
  },
});
