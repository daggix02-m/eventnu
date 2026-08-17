import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { patchDefined, requireAdmin, requireUser, insertModerationLog } from './helpers'
import { paginationOptsValidator } from 'convex/server'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const page = await ctx.db.query('organizerProfiles').order('desc').paginate(args.paginationOpts)
    let rows = page.page
    if (args.search) {
      const q = args.search.toLowerCase()
      rows = rows.filter((o) => o.organizerName.toLowerCase().includes(q))
    }
    return { ...page, page: rows }
  },
})

export const getById = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const org = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first()
    return org ?? null
  },
})

export const getVerified = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('organizerProfiles')
      .filter((q) => q.eq(q.field('verified'), true))
      .take(100)
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query('organizerProfiles').take(500)
    return { total: all.length, verified: all.filter((o) => o.verified).length }
  },
})

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    return await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .first()
  },
})

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_handle', (q) => q.eq('organizerHandle', args.handle))
      .first()
    if (!org) return null

    const profile = await ctx.db.get('profiles', org.profileId)
    const events = await ctx.db
      .query('events')
      .withIndex('by_organizerId_and_status', (q) =>
        q.eq('organizerId', org.profileId).eq('status', 'published'),
      )
      .take(50)

    return {
      id: org._id,
      handle: org.organizerHandle ?? null,
      name: org.organizerName,
      bio: org.bio ?? null,
      logoUrl: org.logoUrl ?? null,
      website: org.website ?? null,
      contactEmail: org.contactEmail ?? null,
      followerCount: org.followerCount,
      verified: profile?.verified ?? false,
      fullName: profile?.fullName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      events: events.map((e) => ({
        id: e._id,
        title: e.title,
        slug: e.slug,
        startDate: e.startDate,
        venueName: e.venueName,
        posterUrl: e.posterUrl,
      })),
    }
  },
})

export const create = mutation({
  args: {
    organizerName: v.string(),
    organizerHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    socialLinks: v.optional(v.any()),
    managementMode: v.optional(v.union(v.literal('admin_managed'), v.literal('organizer_managed'))),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const existing = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .first()
    if (existing) throw new Error('Organizer profile already exists')

    if (profile.role !== 'organizer') {
      await ctx.db.patch('profiles', profile._id, { role: 'organizer' })
    }

    // Only an admin may create an admin-managed profile; self-service signups
    // are organizer-managed by default.
    const managementMode =
      profile.role === 'admin' ? (args.managementMode ?? 'organizer_managed') : 'organizer_managed'

    return await ctx.db.insert('organizerProfiles', {
      profileId: profile._id,
      organizerName: args.organizerName,
      organizerHandle: args.organizerHandle ?? undefined,
      bio: args.bio ?? undefined,
      logoUrl: args.logoUrl ?? undefined,
      website: args.website ?? undefined,
      contactEmail: args.contactEmail ?? undefined,
      socialLinks: args.socialLinks ?? undefined,
      managementMode,
      followerCount: 0,
      verified: false,
    })
  },
})

export const update = mutation({
  args: {
    profileId: v.id('profiles'),
    organizerName: v.optional(v.string()),
    organizerHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    socialLinks: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    if (profile.role !== 'admin' && profile._id !== args.profileId) {
      throw new Error('Not authorized')
    }
    const { profileId, ...fields } = args
    const updates = patchDefined(fields)
    const existing = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .first()
    if (existing) {
      await ctx.db.patch('organizerProfiles', existing._id, updates)
    }
  },
})

export const verify = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first()
    if (existing) {
      await ctx.db.patch('organizerProfiles', existing._id, { verified: true })
    }
  },
})

export const unverify = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const existing = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first()
    if (existing) {
      await ctx.db.patch('organizerProfiles', existing._id, { verified: false })
    }
  },
})

export const setManagementMode = mutation({
  args: {
    profileId: v.id('profiles'),
    managementMode: v.union(v.literal('admin_managed'), v.literal('organizer_managed')),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const existing = await ctx.db
      .query('organizerProfiles')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first()
    if (!existing) throw new Error('Organizer profile not found')
    await ctx.db.patch('organizerProfiles', existing._id, {
      managementMode: args.managementMode,
    })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: `set_management_mode_${args.managementMode}`,
      targetType: 'organizer',
      targetId: args.profileId,
    })
  },
})
