import type { ConvexAuthActionsContext } from '@convex-dev/auth/react'

type RedeemResult = { signingIn: boolean }

export const AUTH_REDIRECT_KEY = 'eventnu_auth_redirect'

function isSafeInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
}

export function rememberAuthRedirect(pathname: string, search = ''): void {
  const target = `${pathname}${search}`
  if (!isSafeInternalPath(target)) return
  try {
    sessionStorage.setItem(AUTH_REDIRECT_KEY, target)
  } catch {
    /* storage unavailable */
  }
}

export function consumeAuthRedirect(fallback = '/'): string {
  try {
    const target = sessionStorage.getItem(AUTH_REDIRECT_KEY)
    sessionStorage.removeItem(AUTH_REDIRECT_KEY)
    return target && isSafeInternalPath(target) ? target : fallback
  } catch {
    return fallback
  }
}

/**
 * Redeem a verification code. The @convex-dev/auth runtime accepts a
 * provider-less `signIn` when a `code` is present, but the TypeScript
 * signature requires a provider string — this wrapper bridges the gap.
 */
export async function redeemVerificationCode(
  signIn: ConvexAuthActionsContext['signIn'],
  email: string,
  code: string,
): Promise<RedeemResult> {
  return await (
    signIn as unknown as (params: { email: string; code: string }) => Promise<RedeemResult>
  )({
    email,
    code,
  })
}
