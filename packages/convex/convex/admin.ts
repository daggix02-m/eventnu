import { v } from 'convex/values'
import { action, internalMutation } from './_generated/server'
import { env } from './_generated/server'
import { internal } from './_generated/api'
import { createAccount, modifyAccountCredentials } from '@convex-dev/auth/server'
import type { Id, TableNames } from './_generated/dataModel'
import { rateLimiter } from './rateLimiter'

type AdminInfo = { profileId: Id<'profiles'>; email: string | null }

function requireAdminEmail(): string {
  const email = env.ADMIN_EMAIL
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL environment variable is not configured or invalid')
  }
  return email.trim().toLowerCase()
}

const ALL_TABLES: TableNames[] = [
  'users',
  'authSessions',
  'authAccounts',
  'authRefreshTokens',
  'authVerificationCodes',
  'authVerifiers',
  'authRateLimits',
  'profiles',
  'events',
  'eventCategories',
  'eventImages',
  'categories',
  'organizerProfiles',
  'eventLikes',
  'eventComments',
  'eventShares',
  'experiencePosts',
  'follows',
  'pages',
  'announcements',
  'contactSubmissions',
  'notifications',
  'reports',
  'moderationLogs',
  'reservationRequests',
  'featuredSections',
  'supportTickets',
  'adminSettings',
  'eventBookmarks',
  'bookmarkFolders',
  'verificationScores',
  'engagementCounters',
  'organizerSettings',
  'cronCheckpoints',
  'instagramConnections',
  'instagramConnectStates',
  'instagramSyncLogs',
]

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  let diff = aBytes.length ^ bBytes.length
  const max = Math.max(aBytes.length, bBytes.length)
  for (let i = 0; i < max; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return diff === 0
}

function validateBootstrapKey(key: string): void {
  if (!env.ADMIN_BOOTSTRAP_KEY || !constantTimeEquals(key, env.ADMIN_BOOTSTRAP_KEY)) {
    throw new Error('Invalid bootstrap key')
  }
}

function requireAdminPassword(): string {
  if (!env.ADMIN_BOOTSTRAP_PASSWORD) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD not configured')
  }
  return env.ADMIN_BOOTSTRAP_PASSWORD
}

export const getAdminInfo = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'bootstrapAction', { key: 'global', throws: true })
    validateBootstrapKey(args.key)
    const adminEmail = requireAdminEmail()
    const admins: AdminInfo[] = await ctx.runQuery(internal.instagram.connect.listAdmins)
    return {
      admins: admins.map((p: AdminInfo) => ({
        email: p.email ?? null,
        profileId: p.profileId,
      })),
      pinnedAdminEmail: adminEmail,
      pinnedAdminExists: admins.some((p: AdminInfo) => p.email === adminEmail),
    }
  },
})

export const createAdminUser = action({
  args: { email: v.string(), name: v.string(), key: v.string() },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'bootstrapAction', { key: 'global', throws: true })
    validateBootstrapKey(args.key)

    const adminEmail = requireAdminEmail()
    const email = normalizeEmail(args.email)
    if (email !== adminEmail) {
      throw new Error('Only the pinned admin email can be created')
    }

    const admins: AdminInfo[] = await ctx.runQuery(internal.instagram.connect.listAdmins)
    if (admins.length > 0) {
      throw new Error('An admin already exists. Admin creation is bootstrap-only.')
    }

    const { user } = await createAccount(ctx, {
      provider: 'password',
      account: { id: email, secret: requireAdminPassword() },
      profile: { email, name: args.name },
    })

    await ctx.runMutation(internal.admin.createAdminProfile, {
      authUserId: user._id,
      email,
      fullName: args.name,
    })

    return { userId: user._id }
  },
})

export const setAdminPassword = action({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'bootstrapAction', { key: 'global', throws: true })
    validateBootstrapKey(args.key)

    const adminEmail = requireAdminEmail()
    const admins: AdminInfo[] = await ctx.runQuery(internal.instagram.connect.listAdmins)
    const admin = admins.find((a: AdminInfo) => a.email === adminEmail)
    if (!admin) {
      throw new Error('Pinned admin does not exist')
    }

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: adminEmail, secret: requireAdminPassword() },
    })

    return { email: adminEmail, updated: true }
  },
})

export const createAdminProfile = internalMutation({
  args: {
    authUserId: v.id('users'),
    email: v.string(),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const byUser = await ctx.db
      .query('profiles')
      .withIndex('by_auth_user', (q) => q.eq('authUserId', args.authUserId))
      .first()
    if (byUser) throw new Error('A profile already exists for this account')

    const byEmail = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first()
    if (byEmail) throw new Error('A profile already exists for this email')

    return await ctx.db.insert('profiles', {
      authUserId: args.authUserId,
      role: 'admin',
      verified: false,
      followerCount: 0,
      fullName: args.fullName,
      email: args.email,
      suspended: false,
    })
  },
})

export const wipeDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deleted: Record<string, number> = {}
    for (const table of ALL_TABLES) {
      let count = 0
      for (;;) {
        const docs = await ctx.db.query(table).take(1000)
        if (docs.length === 0) break
        for (const doc of docs) await ctx.db.delete(table, doc._id)
        count += docs.length
      }
      deleted[table] = count
    }
    return deleted
  },
})

export const resetAdmins = action({
  args: {
    name: v.optional(v.string()),
    key: v.string(),
    confirm: v.literal('WIPE_ALL_DATA'),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    deleted: Record<string, number>
    adminProfileId: Id<'profiles'>
    email: string
  }> => {
    await rateLimiter.limit(ctx, 'bootstrapAction', { key: 'global', throws: true })
    validateBootstrapKey(args.key)

    const adminEmail = requireAdminEmail()

    const deleted: Record<string, number> = await ctx.runMutation(internal.admin.wipeDatabase, {})

    const { user } = await createAccount(ctx, {
      provider: 'password',
      account: { id: adminEmail, secret: requireAdminPassword() },
      profile: { email: adminEmail, name: args.name },
    })

    const adminProfileId: Id<'profiles'> = await ctx.runMutation(
      internal.admin.createAdminProfile,
      {
        authUserId: user._id,
        email: adminEmail,
        fullName: args.name,
      },
    )

    return { deleted, adminProfileId, email: adminEmail }
  },
})

export const seedBaseData = action({
  args: { key: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{
    categoriesSeeded: boolean
    sectionsSeeded: boolean
    events: { created: number; skipped: number }
  }> => {
    await rateLimiter.limit(ctx, 'bootstrapAction', { key: 'global', throws: true })
    validateBootstrapKey(args.key)

    const base = await ctx.runMutation(internal.seed.insertBaseData, {})
    const events = await ctx.runMutation(internal.seed.insertSeedEvents, {})

    return {
      categoriesSeeded: base.categoriesSeeded,
      sectionsSeeded: base.sectionsSeeded,
      events,
    }
  },
})
