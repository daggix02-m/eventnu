import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { insertModerationLog, insertNotification, requireAdmin } from './helpers'
import { paginationOptsValidator } from 'convex/server'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    targetType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const page =
      args.status && args.status !== 'all'
        ? await ctx.db
            .query('reports')
            .withIndex('by_status', (q) => q.eq('status', args.status as Doc<'reports'>['status']))
            .order('desc')
            .paginate(args.paginationOpts)
        : await ctx.db.query('reports').order('desc').paginate(args.paginationOpts)
    let rows = page.page
    if (args.targetType && args.targetType !== 'all') {
      rows = rows.filter((r) => r.targetType === args.targetType)
    }
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const reporter = await ctx.db.get('profiles', r.reporterId)
        return { ...r, reporter: reporter ?? null }
      }),
    )
    return { ...page, page: enriched }
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const byStatus = new Map<Doc<'reports'>['status'], number>()
    let total = 0
    let cursor: string | null = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db.query('reports').order('desc').paginate({ cursor, numItems: 500 })
      for (const report of page.page) {
        total++
        byStatus.set(report.status, (byStatus.get(report.status) ?? 0) + 1)
      }
      if (page.isDone) break
      cursor = page.continueCursor
    }
    return {
      total,
      pending: byStatus.get('pending') ?? 0,
      actioned: byStatus.get('actioned') ?? 0,
      dismissed: byStatus.get('dismissed') ?? 0,
    }
  },
})

export const getTargetPreview = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (args.targetType === 'event') {
      return await ctx.db.get('events', args.targetId as Id<'events'>)
    }
    if (args.targetType === 'host') {
      return await ctx.db.get('hosts', args.targetId as Id<'hosts'>)
    }
    if (args.targetType === 'user') {
      return await ctx.db.get('profiles', args.targetId as Id<'profiles'>)
    }
    if (args.targetType === 'comment') {
      return await ctx.db.get('eventComments', args.targetId as Id<'eventComments'>)
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
    await insertModerationLog(ctx, {
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
    await insertNotification(ctx, {
      userId: args.profileId,
      type: 'warning',
      title: 'Moderation Warning',
      body: 'You have received a warning regarding your recent activity.',
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
