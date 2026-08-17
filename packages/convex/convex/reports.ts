import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { insertModerationLog, insertNotification, requireAdmin } from './helpers'
import { paginationOptsValidator } from 'convex/server'
import { STATS_SCAN_CAP } from './constants'

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    targetType: v.optional(
      v.union(
        v.literal('all'),
        v.literal('event'),
        v.literal('host'),
        v.literal('user'),
        v.literal('comment'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { paginationOpts, status, targetType } = args
    const base =
      status && status !== 'all'
        ? ctx.db
            .query('reports')
            .withIndex('by_status', (q) => q.eq('status', status as Doc<'reports'>['status']))
        : ctx.db.query('reports')
    const page = await base
      .order('desc')
      .filter((f) =>
        f.and(
          ...(targetType && targetType !== 'all' ? [f.eq(f.field('targetType'), targetType)] : []),
        ),
      )
      .paginate(args.paginationOpts)
    const enriched = await Promise.all(
      page.page.map(async (r) => {
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
    const [pending, actioned, dismissed] = await Promise.all([
      ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', 'pending'))
        .take(STATS_SCAN_CAP),
      ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', 'actioned'))
        .take(STATS_SCAN_CAP),
      ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', 'dismissed'))
        .take(STATS_SCAN_CAP),
    ])
    return {
      total: pending.length + actioned.length + dismissed.length,
      pending: pending.length,
      actioned: actioned.length,
      dismissed: dismissed.length,
    }
  },
})

export const getTargetPreview = query({
  args: {
    targetType: v.union(
      v.literal('event'),
      v.literal('host'),
      v.literal('user'),
      v.literal('comment'),
    ),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    if (args.targetType === 'event') {
      return await ctx.db.get('events', args.targetId as Id<'events'>)
    }
    if (args.targetType === 'host') {
      return await ctx.db.get('organizerProfiles', args.targetId as Id<'organizerProfiles'>)
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
