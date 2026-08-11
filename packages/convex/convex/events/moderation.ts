import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { Doc } from '../_generated/dataModel'
import { requireAdmin } from '../helpers'

export const updateStatus = mutation({
  args: {
    eventId: v.id('events'),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      status: args.status as Doc<'events'>['status'],
      ...(args.note ? { adminNote: args.note } : {}),
    })
  },
})

export const bulkUpdateStatus = mutation({
  args: {
    eventIds: v.array(v.id('events')),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    for (const eventId of args.eventIds) {
      await ctx.db.patch('events', eventId, {
        status: args.status as Doc<'events'>['status'],
      })
    }
  },
})

export const feature = mutation({
  args: {
    eventId: v.id('events'),
    section: v.string(),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: true,
      featuredSection: args.section,
      featuredUntil: args.until ?? undefined,
    })
  },
})

export const unfeature = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: false,
      featuredSection: undefined,
      featuredUntil: undefined,
    })
  },
})
