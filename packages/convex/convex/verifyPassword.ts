import { v } from "convex/values";
import { retrieveAccount } from "@convex-dev/auth/server";
import { action } from "./_generated/server";

export const verifyPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: normalizedEmail, secret: password },
      });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "InvalidAccountId" || msg === "InvalidSecret") {
        throw new Error("Invalid credentials");
      }
      if (msg === "TooManyFailedAttempts") {
        throw new Error("TooManyFailedAttempts");
      }
      throw err;
    }
  },
});
