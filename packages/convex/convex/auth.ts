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

const RESEND_BASE = 'https://api.resend.com'
const DEFAULT_FROM = 'EventNu <onboarding@resend.dev>'
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function generateCode(length = 8): string {
  const buf = new Uint32Array(length)
  crypto.getRandomValues(buf)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length]
  }
  return code
}

const emailProvider = {
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
    const envVars = env as unknown as Record<string, string | undefined>
    const apiKey = envVars.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY not configured')
    const from = envVars.RESEND_FROM ?? DEFAULT_FROM

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">Your EventNu sign-in link</h2>
        <p>Hi there,</p>
        <p>Use the button below to securely sign in to EventNu. This link expires in one hour.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(url)}" style="background:#a078ff;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;font-weight:bold">
            Sign in to EventNu
          </a>
        </p>
        <p>Or enter this code manually:</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center">
          ${escapeHtml(token)}
        </div>
        <p style="color:#666;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `

    const res = await fetch(`${RESEND_BASE}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: 'Your EventNu sign-in code',
        html,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend error ${res.status}: ${text}`)
    }
  },
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
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
      reset: Email(emailProvider),
    }),
    Email(emailProvider),
  ],
})

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_current_password' | 'rate_limited' | 'not_authenticated' }

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }): Promise<ChangePasswordResult> => {
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
