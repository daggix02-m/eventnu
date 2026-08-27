import { v, ConvexError } from 'convex/values'
import { query, mutation, internalQuery } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { patchDefined, getUserProfile, requireAdmin, requireUser, validateUrl } from './helpers'
import { paginationOptsValidator } from 'convex/server'
import { rateLimiter } from './rateLimiter'
import type { Doc, Id } from './_generated/dataModel'
import type { QueryCtx, MutationCtx } from './_generated/server'

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/
const MAX_FULL_NAME_LENGTH = 100
const MAX_BIO_LENGTH = 280
const MAX_LOCATION_LENGTH = 100
const VALID_THEMES = ['system', 'light', 'dark'] as const

const USER_STATUS = v.union(
  v.literal('all'),
  v.literal('active'),
  v.literal('suspended'),
  v.literal('no_profile'),
)

function toUserRow(user: Doc<'users'>, profile: Doc<'profiles'> | null | undefined) {
  return {
    authUserId: user._id,
    email: user.email ?? '',
    name: user.name ?? null,
    image: user.image ?? null,
    profileId: profile?._id ?? null,
    role: profile?.role ?? 'user',
    verified: profile?.verified ?? false,
    verifiedAt: profile?.verifiedAt ?? null,
    fullName: profile?.fullName ?? user.name ?? null,
    avatarUrl: profile?.avatarUrl ?? user.image ?? null,
    suspended: profile?.suspended ?? false,
    hasProfile: !!profile,
    created_at: user._creationTime,
  }
}

async function getProfileByAuthUserId(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<Doc<'profiles'> | null> {
  return await ctx.db
    .query('profiles')
    .withIndex('by_auth_user', (q) => q.eq('authUserId', userId))
    .first()
}

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getUserProfile(ctx)
  },
})

export const getProfileEmail = internalQuery({
  args: { authUserId: v.id('users') },
  handler: async (ctx, args) => {
    const profile = await getProfileByAuthUserId(ctx, args.authUserId)
    return profile?.email ?? null
  },
})

export const ensureProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const existing = await ctx.db
      .query('profiles')
      .withIndex('by_auth_user', (q) => q.eq('authUserId', userId))
      .first()
    if (existing) return { id: existing._id, created: false }

    const user = await ctx.db.get('users', userId)
    const email = user?.email
    if (!email) throw new ConvexError('Account has no email')

    const byEmail = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('email'), email))
      .first()
    if (byEmail) {
      if (!byEmail.authUserId) {
        await ctx.db.patch('profiles', byEmail._id, {
          authUserId: userId,
        })
      }
      return { id: byEmail._id, created: false }
    }

    const id = await ctx.db.insert('profiles', {
      authUserId: userId,
      role: 'user',
      verified: false,
      followerCount: 0,
      fullName: args.fullName ?? user.name,
      email,
      suspended: false,
    })
    return { id, created: true }
  },
})

export const acceptTerms = mutation({
  args: { version: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await ctx.db.patch('profiles', profile._id, {
      acceptedTermsAt: Date.now(),
      acceptedTermsVersion: args.version,
    })
  },
})

export const getById = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.get('profiles', args.profileId)
  },
})

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const profiles = await ctx.db.query('profiles').take(200)
    if (args.search) {
      const q = args.search.toLowerCase()
      return profiles.filter(
        (p) =>
          (p.fullName && p.fullName.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)),
      )
    }
    return profiles
  },
})

export const listUsers = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(USER_STATUS),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const q = args.search?.trim().toLowerCase()
    const numItems = Math.min(Math.max(1, args.paginationOpts.numItems), 100)

    // Filtering happens on a bounded candidate set BEFORE slicing the page:
    // the previous code paginated the raw table and then filtered in memory,
    // so searches for older users or status filters silently returned wrong
    // (mostly empty) pages. The candidate scan is capped at 1000 rows; within
    // that cap the pagination is exact.
    const users = await ctx.db.query('users').order('desc').take(1000)
    const allProfiles = await ctx.db.query('profiles').take(1000)
    const profileByAuth = new Map<Id<'users'>, Doc<'profiles'>>()
    for (const p of allProfiles) {
      if (p.authUserId) profileByAuth.set(p.authUserId, p)
    }

    const rows = users
      .map((u) => toUserRow(u, profileByAuth.get(u._id)))
      .filter((row) => {
        if (args.status === 'active') return row.hasProfile && !row.suspended
        if (args.status === 'suspended') return row.hasProfile && row.suspended
        if (args.status === 'no_profile') return !row.hasProfile
        return true
      })
      .filter((row) => {
        if (!q) return true
        return (
          row.email.toLowerCase().includes(q) ||
          (row.fullName ?? '').toLowerCase().includes(q) ||
          (row.name ?? '').toLowerCase().includes(q)
        )
      })

    const offset = args.paginationOpts.cursor ? Number.parseInt(args.paginationOpts.cursor, 10) : 0
    const pageRows = rows.slice(offset, offset + numItems)
    const nextOffset = offset + numItems
    return {
      page: pageRows,
      continueCursor: nextOffset < rows.length ? String(nextOffset) : null,
      isDone: nextOffset >= rows.length,
    }
  },
})

export const listProfileIds = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const ids: Id<'profiles'>[] = []
    let cursor: string | null = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db
        .query('profiles')
        .withIndex('by_role')
        .paginate({ cursor, numItems: 500 })
      ids.push(...page.page.map((p) => p._id))
      if (page.isDone || page.continueCursor === null) break
      cursor = page.continueCursor
    }
    return ids
  },
})

export const getUserByAuthId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get('users', args.userId)
    if (!user) return null
    const profile = await getProfileByAuthUserId(ctx, user._id)
    return toUserRow(user, profile)
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const profiles = await ctx.db.query('profiles').take(1000)
    return {
      total: profiles.length,
      suspended: profiles.filter((p) => p.suspended).length,
      admins: profiles.filter((p) => p.role === 'admin').length,
    }
  },
})

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const suspendedByUser = new Map<Id<'users'>, boolean>()
    let cursor: string | null = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db
        .query('profiles')
        .withIndex('by_role')
        .paginate({ cursor, numItems: 500 })
      for (const profile of page.page) {
        if (profile.authUserId) suspendedByUser.set(profile.authUserId, profile.suspended)
      }
      if (page.isDone) break
      cursor = page.continueCursor
    }

    let total = 0
    let suspended = 0
    let noProfile = 0
    cursor = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db.query('users').order('desc').paginate({ cursor, numItems: 500 })
      for (const user of page.page) {
        total++
        if (!suspendedByUser.has(user._id)) {
          noProfile++
        } else if (suspendedByUser.get(user._id)) {
          suspended++
        }
      }
      if (page.isDone) break
      cursor = page.continueCursor
    }

    return { total, active: total - suspended - noProfile, suspended, noProfile }
  },
})

export const updateProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    if (profile.role !== 'admin' && profile._id !== args.profileId) {
      throw new Error('Not authorized')
    }
    const { profileId, ...fields } = args
    if (profile.role !== 'admin' && fields.email !== undefined && fields.email !== profile.email) {
      throw new Error('Non-admin users cannot change profile email directly')
    }
    const updates = patchDefined(fields)
    await ctx.db.patch('profiles', profileId, updates)
  },
})

export const updateMe = mutation({
  args: {
    fullName: v.optional(v.string()),
    bio: v.optional(v.string()),
    username: v.optional(v.string()),
    locationText: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarStorageId: v.optional(v.string()),
    emailNotifications: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),
    privateProfile: v.optional(v.boolean()),
    themePreference: v.optional(
      v.union(v.literal('system'), v.literal('light'), v.literal('dark')),
    ),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'profileUpdate', { key: profile._id, throws: true })

    const updates: Record<string, unknown> = {}

    if (args.fullName !== undefined) {
      const name = args.fullName.trim()
      if (!name || name.length > MAX_FULL_NAME_LENGTH) {
        throw new Error('Full name must be 1-100 characters')
      }
      updates.fullName = name
    }

    if (args.bio !== undefined) {
      const bio = args.bio.trim()
      if (bio.length > MAX_BIO_LENGTH) {
        throw new Error('Bio must be 280 characters or fewer')
      }
      updates.bio = bio.length > 0 ? bio : undefined
    }

    if (args.username !== undefined) {
      const username = args.username.trim().toLowerCase()
      if (!USERNAME_RE.test(username)) {
        throw new Error(
          'Username must be 3-30 characters and use only letters, numbers, dots, or underscores',
        )
      }
      const existing = await ctx.db
        .query('profiles')
        .withIndex('by_username', (q) => q.eq('username', username))
        .first()
      if (existing && existing._id !== profile._id) {
        throw new Error('Username is already taken')
      }
      updates.username = username
    }

    if (args.locationText !== undefined) {
      const location = args.locationText.trim()
      if (location.length > MAX_LOCATION_LENGTH) {
        throw new Error('Location must be 100 characters or fewer')
      }
      updates.locationText = location.length > 0 ? location : undefined
    }

    if (args.website !== undefined) {
      const website = args.website.trim()
      if (website) {
        validateUrl(website, 'Website')
      }
      updates.website = website.length > 0 ? website : undefined
    }

    if (args.themePreference !== undefined) {
      if (!(VALID_THEMES as readonly string[]).includes(args.themePreference)) {
        throw new Error('Invalid theme preference')
      }
      updates.themePreference = args.themePreference
    }

    if (args.emailNotifications !== undefined) updates.emailNotifications = args.emailNotifications
    if (args.pushNotifications !== undefined) updates.pushNotifications = args.pushNotifications
    if (args.privateProfile !== undefined) updates.privateProfile = args.privateProfile

    if (args.avatarStorageId !== undefined && args.avatarStorageId !== profile.avatarStorageId) {
      const url = await ctx.storage.getUrl(args.avatarStorageId as Id<'_storage'>)
      if (!url) throw new Error('Uploaded file not found')
      if (profile.avatarStorageId) {
        await ctx.storage.delete(profile.avatarStorageId as Id<'_storage'>)
      }
      updates.avatarUrl = url
      updates.avatarStorageId = args.avatarStorageId
    }

    await ctx.db.patch('profiles', profile._id, updates)
  },
})

export const suspend = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    if (admin._id === args.profileId) {
      throw new Error('You cannot suspend your own account')
    }
    await ctx.db.patch('profiles', args.profileId, { suspended: true })
  },
})

export const unsuspend = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('profiles', args.profileId, { suspended: false })
  },
})

export const setUserSuspended = mutation({
  args: { userId: v.id('users'), suspended: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    if (args.suspended && admin.authUserId === args.userId) {
      throw new Error('You cannot suspend your own account')
    }

    const user = await ctx.db.get('users', args.userId)
    if (!user) throw new Error('User not found')

    const profile = await getProfileByAuthUserId(ctx, args.userId)
    if (profile) {
      await ctx.db.patch('profiles', profile._id, { suspended: args.suspended })
      return
    }

    const byEmail = await ctx.db
      .query('profiles')
      .filter((q) => q.eq(q.field('email'), user.email ?? ''))
      .first()
    if (byEmail) {
      await ctx.db.patch('profiles', byEmail._id, {
        authUserId: args.userId,
        suspended: args.suspended,
      })
      return
    }

    await ctx.db.insert('profiles', {
      authUserId: args.userId,
      role: 'user',
      verified: false,
      followerCount: 0,
      fullName: user.name ?? undefined,
      email: user.email ?? undefined,
      suspended: args.suspended,
    })
  },
})

export const setRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(v.literal('admin'), v.literal('user')),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    if (admin.authUserId === args.userId && args.role !== 'admin') {
      throw new Error('You cannot demote your own account')
    }

    const profile = await getProfileByAuthUserId(ctx, args.userId)
    if (!profile) throw new Error('User has no profile yet')
    await ctx.db.patch('profiles', profile._id, { role: args.role })
  },
})

export const getUserWithCounts = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const profile = await ctx.db.get('profiles', args.profileId)
    if (!profile) return null

    const org = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first()
    const events = org
      ? await ctx.db
          .query('events')
          .withIndex('by_owner', (q) => q.eq('ownerId', org._id))
          .take(500)
      : []
    const likes = await ctx.db
      .query('eventLikes')
      .withIndex('by_user', (q) => q.eq('userId', args.profileId))
      .take(500)
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', args.profileId))
      .take(500)
    const allComments = await ctx.db.query('eventComments').take(1000)
    const comments = allComments.filter((c) => c.userId === args.profileId)

    return {
      ...profile,
      eventCount: events.length,
      likeCount: likes.length,
      followCount: follows.length,
      commentCount: comments.length,
    }
  },
})
