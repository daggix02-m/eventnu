import { v } from "convex/values";
import { retrieveAccount } from "@convex-dev/auth/server";
import { action } from "./_generated/server";

export type VerifyPasswordResult =
  | { ok: true }
  | { ok: false; reason: "invalid_account" | "invalid_secret" | "rate_limited" };

export const verifyPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }): Promise<VerifyPasswordResult> => {
    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: email.trim(), secret: password },
      });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "InvalidAccountId") return { ok: false, reason: "invalid_account" };
      if (msg === "InvalidSecret") return { ok: false, reason: "invalid_secret" };
      if (msg === "TooManyFailedAttempts") return { ok: false, reason: "rate_limited" };
      throw err;
    }
  },
});
