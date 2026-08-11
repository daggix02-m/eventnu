import type { ConvexAuthActionsContext } from '@convex-dev/auth/react'

type AuthResult = { signingIn: boolean }

/**
 * Keys used by the auth pages to remember the email across redirects.
 * Stored in sessionStorage (per-tab), not localStorage, to avoid leaking
 * the address into other tabs.
 */
export const AUTH_EMAIL_KEY = 'eventnu_admin_auth_email'
export const RESET_EMAIL_KEY = 'eventnu_admin_reset_email'

export function setStoredEmail(key: string, email: string): void {
  try {
    sessionStorage.setItem(key, email)
  } catch {
    /* storage unavailable */
  }
}

export function getStoredEmail(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export function clearStoredEmail(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

export const INVALID_CREDENTIALS = 'Invalid email or password'
export const RATE_LIMITED = 'Too many failed sign-in attempts. Try again in about an hour.'
const UNAVAILABLE = 'Unable to sign in right now. Please try again.'

export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('Network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('Could not connect to the Convex deployment')
  )
}

export function describeSignInError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid credentials') || msg.includes('InvalidAccountId')) {
      return INVALID_CREDENTIALS
    }
    if (msg.includes('TooManyFailedAttempts')) return RATE_LIMITED
    if (isNetworkError(err)) return UNAVAILABLE
  }
  return fallback
}

/**
 * Redeem a verification / reset code. The @convex-dev/auth runtime accepts a
 * provider-less `signIn` when a `code` is present, but the TypeScript signature
 * requires a provider string — this wrapper bridges the gap.
 */
export async function redeemVerificationCode(
  signIn: ConvexAuthActionsContext['signIn'],
  email: string,
  code: string,
): Promise<AuthResult> {
  return await (
    signIn as unknown as (params: { email: string; code: string }) => Promise<AuthResult>
  )({
    email,
    code,
  })
}
