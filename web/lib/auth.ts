import type { ConvexAuthActionsContext } from "@convex-dev/auth/react";

type RedeemResult = { signingIn: boolean };

/**
 * Redeem a verification code. The @convex-dev/auth runtime accepts a
 * provider-less `signIn` when a `code` is present, but the TypeScript
 * signature requires a provider string — this wrapper bridges the gap.
 */
export async function redeemVerificationCode(
  signIn: ConvexAuthActionsContext["signIn"],
  email: string,
  code: string,
): Promise<RedeemResult> {
  return await (signIn as unknown as (params: { email: string; code: string }) => Promise<RedeemResult>)({
    email,
    code,
  });
}
