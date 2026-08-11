import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { patchDefined, requireAdmin } from './helpers'

export const list = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const organizers = await ctx.db.query('organizerProfiles').take(200)
    if (args.search) {
      const q = args.search.toLowerCase()
      return organizers.filter((o) => o.organizerName.toLowerCase().includes(q))
    }
    return organizers
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

export const create = mutation({
  args: {
    profileId: v.id('profiles'),
    organizerName: v.string(),
    organizerHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    website: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    socialLinks: v.optional(v.any()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('organizerProfiles', {
      profileId: args.profileId,
      organizerName: args.organizerName,
      organizerHandle: args.organizerHandle ?? undefined,
      bio: args.bio ?? undefined,
      logoUrl: args.logoUrl ?? undefined,
      website: args.website ?? undefined,
      contactEmail: args.contactEmail ?? undefined,
      socialLinks: args.socialLinks ?? undefined,
      followerCount: 0,
      verified: args.verified ?? false,
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
    await requireAdmin(ctx)
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
