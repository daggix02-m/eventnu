import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { requireAdmin } from './helpers'

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    hostType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const hosts = await ctx.db.query('hosts').take(200)
    let filtered = hosts
    if (args.status && args.status !== 'all') {
      filtered = filtered.filter((h) => h.status === args.status)
    }
    if (args.hostType && args.hostType !== 'all') {
      filtered = filtered.filter((h) => h.hostType === args.hostType)
    }
    if (args.search) {
      const q = args.search.toLowerCase()
      filtered = filtered.filter((h) => h.name.toLowerCase().includes(q))
    }
    return filtered
  },
})

export const getById = query({
  args: { hostId: v.id('hosts') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.get('hosts', args.hostId)
  },
})

export const getStats = query({
  args: { hostId: v.id('hosts') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const events = await ctx.db
      .query('events')
      .withIndex('by_host', (q) => q.eq('hostId', args.hostId))
      .take(500)
    return { eventCount: events.length }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    hostType: v.string(),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    locationText: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('hosts', {
      name: args.name,
      slug: args.slug,
      hostType: args.hostType,
      description: args.description ?? '',
      contactEmail: args.contactEmail ?? undefined,
      contactPhone: args.contactPhone ?? undefined,
      website: args.website ?? undefined,
      locationText: args.locationText ?? '',
      logoUrl: args.logoUrl ?? undefined,
      verified: args.verified ?? false,
      status: args.status ?? 'active',
      followerCount: 0,
    })
  },
})

export const update = mutation({
  args: {
    hostId: v.id('hosts'),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    hostType: v.optional(v.string()),
    description: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    locationText: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { hostId, ...fields } = args
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch('hosts', hostId, updates)
  },
})

export const updateStatus = mutation({
  args: { hostId: v.id('hosts'), status: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('hosts', args.hostId, { status: args.status })
  },
})

export const remove = mutation({
  args: { hostId: v.id('hosts') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete('hosts', args.hostId)
  },
})
