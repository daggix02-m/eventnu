import { v } from 'convex/values'
import {
  convexAuth,
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
} from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import { Email } from '@convex-dev/auth/providers/Email'
import { action, env } from './_generated/server'
import { internal } from './_generated/api'
import { escapeHtml } from './helpers'
import { toClientAuthError } from './authErrors'

const RESEND_BASE = 'https://api.resend.com'
const DEFAULT_FROM = 'EventNu <onboarding@resend.dev>'
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function generateCode(length = 10): string {
  const buf = new Uint32Array(length)
  crypto.getRandomValues(buf)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length]
  }
  return code
}

function buildSignInHtml(escapedUrl: string, escapedToken: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 16px">Your EventNu sign-in code</h2>
      <p>Hi there,</p>
      <p>Use the button below to securely sign in to EventNu. This link expires in one hour.</p>
      <p style="margin:24px 0">
        <a href="${escapedUrl}" style="background:#a078ff;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:bold">
          Sign in to EventNu
        </a>
      </p>
      <p>Or enter this code manually:</p>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center">
        ${escapedToken}
      </div>
      <p style="color:#666;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `
}

function buildResetHtml(escapedUrl: string, escapedToken: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 16px">Reset your EventNu password</h2>
      <p>Hi there,</p>
      <p>We received a request to reset your password. Use the button below to set a new password. This link expires in one hour.</p>
      <p style="margin:24px 0">
        <a href="${escapedUrl}" style="background:#a078ff;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:bold">
          Reset your password
        </a>
      </p>
      <p>Or enter this code manually:</p>
      <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center">
        ${escapedToken}
      </div>
      <p style="color:#666;font-size:14px">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `
}

async function sendEmail(email: string, subject: string, html: string): Promise<void> {
  const envVars = env as unknown as Record<string, string | undefined>
  const apiKey = envVars.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')
  const from = envVars.RESEND_FROM ?? DEFAULT_FROM

  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: email, subject, html }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`Resend API error ${res.status}: ${text}`)
    throw new Error('Failed to send verification email')
  }
}

const signInProvider = {
  maxAge: 60 * 60, // 1 hour
  normalizeIdentifier: (identifier: string) => identifier.trim().toLowerCase(),
  generateVerificationToken: () => generateCode(),
  sendVerificationRequest: async ({
    identifier: email,
    url,
    token,
  }: {
    identifier: string
    url: string
    token: string
  }) => {
    await sendEmail(
      email,
      'Your EventNu sign-in code',
      buildSignInHtml(escapeHtml(url), escapeHtml(token)),
    )
  },
}

const resetProvider = {
  maxAge: 60 * 60, // 1 hour
  normalizeIdentifier: (identifier: string) => identifier.trim().toLowerCase(),
  generateVerificationToken: () => generateCode(),
  sendVerificationRequest: async ({
    identifier: email,
    url,
    token,
  }: {
    identifier: string
    url: string
    token: string
  }) => {
    await sendEmail(
      email,
      'Reset your EventNu password',
      buildResetHtml(escapeHtml(url), escapeHtml(token)),
    )
  },
}

/**
 * The runtime provider returned by `Password()` keeps the real `authorize`
 * implementation under `.options` (the public type only exposes a stub).
 * The public `ConvexCredentialsConfig` type does not declare `.options`,
 * so type it narrowly here.
 */
type PasswordProvider = ReturnType<typeof Password> & {
  options: {
    authorize: (
      credentials: Record<string, unknown>,
      ctx: unknown,
    ) => Promise<{ userId: string; sessionId?: string } | null>
  }
}

const basePassword = Password({
  profile(params): { email: string } & Record<string, string> {
    const name = String(params.name ?? '').trim()
    return name
      ? {
          email: String(params.email ?? '')
            .trim()
            .toLowerCase(),
          name,
        }
      : {
          email: String(params.email ?? '')
            .trim()
            .toLowerCase(),
        }
  },
  reset: Email(resetProvider),
})

const passwordProvider: PasswordProvider = {
  ...basePassword,
  options: {
    ...(basePassword as PasswordProvider).options,
    // Expected auth failures (wrong password, unknown account, duplicate
    // sign-up, rate limit) throw plain Errors which Convex redacts to a
    // generic "Server Error" in production. Rethrow them as ConvexErrors
    // carrying a client-safe code so the web app can show a real message.
    authorize: async (credentials, ctx) => {
      try {
        return await (basePassword as PasswordProvider).options.authorize(credentials, ctx)
      } catch (error) {
        const mapped = toClientAuthError(error)
        if (mapped instanceof Error) throw mapped
        throw error
      }
    },
  },
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [passwordProvider, Email(signInProvider)],
})

const MIN_PASSWORD_LENGTH = 8

export type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false
      reason:
        'invalid_current_password' | 'rate_limited' | 'not_authenticated' | 'password_too_short'
    }

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }): Promise<ChangePasswordResult> => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, reason: 'password_too_short' }
    }

    const userId = await getAuthUserId(ctx)
    if (!userId) return { ok: false, reason: 'not_authenticated' }

    const email = await ctx.runQuery(internal.profiles.getProfileEmail, { authUserId: userId })
    if (!email) return { ok: false, reason: 'not_authenticated' }

    try {
      await retrieveAccount(ctx, {
        provider: 'password',
        account: { id: email, secret: currentPassword },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'InvalidSecret') return { ok: false, reason: 'invalid_current_password' }
      if (msg === 'TooManyFailedAttempts') return { ok: false, reason: 'rate_limited' }
      return { ok: false, reason: 'invalid_current_password' }
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: email, secret: newPassword },
    })

    return { ok: true }
  },
})
