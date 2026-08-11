import { getAuthUserId } from '@convex-dev/auth/server'
import { MutationCtx, QueryCtx } from './_generated/server'
import { Doc } from './_generated/dataModel'

export async function getUserProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'> | null> {
  const userId = await getAuthUserId(ctx)
  if (!userId) return null
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_auth_user', (q) => q.eq('authUserId', userId))
    .first()
  return profile ?? null
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const profile = await getUserProfile(ctx)
  if (!profile) throw new Error('Not authenticated')
  if (profile.suspended) throw new Error('Account suspended')
  return profile
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const profile = await requireUser(ctx)
  if (profile.role !== 'admin') throw new Error('Admin access required')
  return profile
}
