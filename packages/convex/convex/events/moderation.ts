import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireAdmin, insertModerationLog } from '../helpers'

const eventStatus = v.union(
  v.literal('draft'),
  v.literal('pending_review'),
  v.literal('published'),
  v.literal('rejected'),
  v.literal('cancelled'),
  v.literal('archived'),
)

const FEATURED_SECTIONS = v.union(
  v.literal('editors_choice'),
  v.literal('trending'),
  v.literal('popular'),
  v.literal('new_and_noteworthy'),
)

export const updateStatus = mutation({
  args: {
    eventId: v.id('events'),
    status: eventStatus,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      status: args.status,
      ...(args.note ? { adminNote: args.note } : {}),
    })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'update_event_status',
      targetType: 'event',
      targetId: args.eventId,
      note: args.note ?? args.status,
    })
  },
})

export const bulkUpdateStatus = mutation({
  args: {
    eventIds: v.array(v.id('events')),
    status: eventStatus,
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    for (const eventId of args.eventIds) {
      await ctx.db.patch('events', eventId, {
        status: args.status,
      })
    }
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'bulk_update_event_status',
      targetType: 'event',
      targetId: args.eventIds.join(','),
      note: args.status,
    })
  },
})

export const feature = mutation({
  args: {
    eventId: v.id('events'),
    section: FEATURED_SECTIONS,
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: true,
      featuredSection: args.section,
      featuredUntil: args.until ?? undefined,
    })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'feature_event',
      targetType: 'event',
      targetId: args.eventId,
      note: args.section,
    })
  },
})

export const unfeature = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: false,
      featuredSection: undefined,
      featuredUntil: undefined,
    })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'unfeature_event',
      targetType: 'event',
      targetId: args.eventId,
    })
  },
})
