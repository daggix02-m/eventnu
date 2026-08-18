import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { insertModerationLog, insertNotification, requireAdmin, requireUser } from './helpers'
import { paginationOptsValidator } from 'convex/server'
import { STATS_SCAN_CAP } from './constants'
import { rateLimiter } from './rateLimiter'

const reportTargetType = v.union(v.literal('event'), v.literal('organizer'))
const reportReason = v.union(
  v.literal('fraud_or_scam'),
  v.literal('illegal_activity'),
  v.literal('unsafe_venue_or_event'),
  v.literal('misleading_information'),
  v.literal('harassment_or_discrimination'),
  v.literal('copyright_or_intellectual_property'),
  v.literal('other'),
)

export const submit = mutation({
  args: {
    targetType: reportTargetType,
    targetId: v.string(),
    reason: reportReason,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reporter = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'reportSubmit', { key: reporter._id, throws: true })
    const target =
      args.targetType === 'event'
        ? await ctx.db.get('events', args.targetId as Id<'events'>)
        : await ctx.db.get('organizerProfiles', args.targetId as Id<'organizerProfiles'>)
    if (!target) throw new Error('Report target not found')
    const duplicate = await ctx.db
      .query('reports')
      .withIndex('by_reporter_and_target', (q) =>
        q
          .eq('reporterId', reporter._id)
          .eq('targetType', args.targetType)
          .eq('targetId', args.targetId),
      )
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .first()
    if (duplicate) throw new Error('You already reported this item')
    const suffix = args.details?.trim() ? `\n\n${args.details.trim().slice(0, 1000)}` : ''
    return await ctx.db.insert('reports', {
      reporterId: reporter._id,
      targetType: args.targetType,
      targetId: args.targetId,
      reason: `${args.reason}${suffix}`,
      status: 'pending',
    })
  },
})

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    targetType: v.optional(
      v.union(
        v.literal('all'),
        v.literal('event'),
        v.literal('organizer'),
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
      v.literal('organizer'),
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
    if (args.targetType === 'organizer') {
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
    const report = await ctx.db.get('reports', args.reportId)
    if (!report) throw new Error('Report not found')
    const actionTargets: Record<string, string[]> = {
      warn_user: ['user'],
      suspend_user: ['user'],
      hide_event: ['event'],
      hide_organizer: ['organizer', 'host'],
      delete_comment: ['comment'],
    }
    if (
      args.action &&
      actionTargets[args.action] &&
      !actionTargets[args.action].includes(report.targetType)
    ) {
      throw new Error('Action does not match report target')
    }
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

export const hideOrganizerFromReport = mutation({
  args: { organizerId: v.id('organizerProfiles') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('organizerProfiles', args.organizerId, { status: 'suspended' })
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
