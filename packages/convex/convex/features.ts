import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { requireAdmin } from './helpers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('featuredSections').order('asc').take(50)
  },
})

export const createDefault = mutation({
  args: {
    slug: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('featuredSections', {
      slug: args.slug,
      label: args.label,
      description: args.description ?? undefined,
      enabled: args.enabled ?? true,
      sortOrder: args.sortOrder ?? 0,
    })
  },
})

export const update = mutation({
  args: {
    sectionId: v.id('featuredSections'),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { sectionId, ...fields } = args
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch('featuredSections', sectionId, updates)
  },
})
