import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { requireAdmin } from './helpers'

export const list = query({
  args: {
    status: v.optional(v.string()),
    targetType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    let reports
    if (args.status && args.status !== 'all') {
      reports = await ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', args.status as any))
        .order('desc')
        .take(100)
    } else {
      reports = await ctx.db.query('reports').order('desc').take(100)
    }
    let filtered = reports
    if (args.targetType && args.targetType !== 'all') {
      filtered = filtered.filter((r) => r.targetType === args.targetType)
    }
    const enriched = await Promise.all(
      filtered.map(async (r) => {
        const reporter = await ctx.db.get('profiles', r.reporterId)
        return { ...r, reporter: reporter ?? null }
      }),
    )
    return enriched
  },
})

export const getTargetPreview = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (args.targetType === 'event') {
      return await ctx.db.get('events', args.targetId as any)
    }
    if (args.targetType === 'host') {
      return await ctx.db.get('hosts', args.targetId as any)
    }
    if (args.targetType === 'user') {
      return await ctx.db.get('profiles', args.targetId as any)
    }
    if (args.targetType === 'comment') {
      return await ctx.db.get('eventComments', args.targetId as any)
    }
    return null
  },
})

export const dismiss = mutation({
  args: { reportId: v.id('reports') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('reports', args.reportId, { status: 'dismissed' })
  },
})

export const actionReport = mutation({
  args: {
    reportId: v.id('reports'),
    action: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await ctx.db.patch('reports', args.reportId, { status: 'actioned' })
    await ctx.db.insert('moderationLogs', {
      adminId: admin._id,
      action: args.action ?? 'actioned',
      targetType: 'report',
      targetId: args.reportId,
      note: args.note ?? undefined,
    })
  },
})

export const warnUserFromReport = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.insert('notifications', {
      userId: args.profileId,
      type: 'warning',
      title: 'Moderation Warning',
      body: 'You have received a warning regarding your recent activity.',
      read: false,
    })
  },
})

export const suspendUserFromReport = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    if (admin._id === args.profileId) {
      throw new Error('You cannot suspend your own account')
    }
    await ctx.db.patch('profiles', args.profileId, { suspended: true })
  },
})

export const hideEventFromReport = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, { status: 'archived' })
  },
})

export const deleteCommentFromReport = mutation({
  args: { commentId: v.id('eventComments') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('eventComments', args.commentId, { isDeleted: true })
  },
})

export const updateNote = mutation({
  args: { reportId: v.id('reports'), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (args.note !== undefined) {
      await ctx.db.patch('reports', args.reportId, { adminNote: args.note })
    }
  },
})
