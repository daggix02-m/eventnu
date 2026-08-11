import { v } from 'convex/values'
import { query, mutation } from '../_generated/server'
import { patchDefined, getUserProfile, requireAdmin } from '../helpers'

export const getActiveAnnouncements = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    const profileId = profile?._id ?? null
    const announcements = await ctx.db
      .query('announcements')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(50)
    return announcements.filter(
      (a) =>
        (a.targetUserId === undefined || a.targetUserId === profileId) &&
        (a.startsAt === undefined || a.startsAt <= args.now) &&
        (a.endsAt === undefined || a.endsAt >= args.now),
    )
  },
})

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('announcements').order('desc').take(100)
  },
})

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('announcements', {
      title: args.title,
      message: args.message ?? undefined,
      linkUrl: args.linkUrl ?? undefined,
      linkText: args.linkText ?? undefined,
      isActive: args.isActive ?? false,
      startsAt: args.startsAt ?? undefined,
      endsAt: args.endsAt ?? undefined,
      targetUserId: args.targetUserId ?? undefined,
    })
  },
})

export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id('announcements'),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { announcementId, ...fields } = args
    const updates = patchDefined(fields)
    await ctx.db.patch('announcements', announcementId, updates)
  },
})

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id('announcements') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete('announcements', args.announcementId)
  },
})
