import { v } from 'convex/values'
import { retrieveAccount, modifyAccountCredentials, getAuthUserId } from '@convex-dev/auth/server'
import { action } from './_generated/server'

export const ADMIN_EMAIL = 'event.nua@gmail.com'

export type VerifyPasswordResult =
  { ok: true } | { ok: false; reason: 'invalid_account' | 'invalid_secret' | 'rate_limited' }

export const verifyPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }): Promise<VerifyPasswordResult> => {
    const normalizedEmail = email.trim().toLowerCase()
    if (normalizedEmail !== ADMIN_EMAIL) {
      return { ok: false, reason: 'invalid_account' }
    }
    try {
      await retrieveAccount(ctx, {
        provider: 'password',
        account: { id: normalizedEmail, secret: password },
      })
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'InvalidAccountId') return { ok: false, reason: 'invalid_account' }
      if (msg === 'InvalidSecret') return { ok: false, reason: 'invalid_secret' }
      if (msg === 'TooManyFailedAttempts') return { ok: false, reason: 'rate_limited' }
      throw err
    }
  },
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

    // Get current user's profile to find email
    const profile = await ctx.runQuery((await import('./_generated/api')).api.profiles.getMe)
    if (!profile?.email) return { ok: false, reason: 'not_authenticated' }

    const email = profile.email

    // Verify current password
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

    // Update to new password
    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: email, secret: newPassword },
    })

    return { ok: true }
  },
})
