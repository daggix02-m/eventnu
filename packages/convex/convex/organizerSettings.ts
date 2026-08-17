import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { patchDefined, requireOrganizerOwner } from './helpers'

const DEFAULT_SETTINGS = {
  hideLikeCount: false,
  notificationEmail: true,
  notificationInApp: true,
  mentionSetting: 'allow' as const,
  tagSetting: 'allow' as const,
  archiveEvents: false,
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireOrganizerOwner(ctx)
    return await ctx.db
      .query('organizerSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .first()
  },
})

export const update = mutation({
  args: {
    hideLikeCount: v.optional(v.boolean()),
    notificationEmail: v.optional(v.boolean()),
    notificationInApp: v.optional(v.boolean()),
    mentionSetting: v.optional(
      v.union(v.literal('allow'), v.literal('block'), v.literal('approve')),
    ),
    tagSetting: v.optional(v.union(v.literal('allow'), v.literal('block'))),
    archiveEvents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireOrganizerOwner(ctx)
    const existing = await ctx.db
      .query('organizerSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .first()
    if (existing) {
      const updates = patchDefined(args)
      await ctx.db.patch('organizerSettings', existing._id, updates)
      return existing._id
    }
    return await ctx.db.insert('organizerSettings', {
      profileId: profile._id,
      hideLikeCount: args.hideLikeCount ?? DEFAULT_SETTINGS.hideLikeCount,
      notificationEmail: args.notificationEmail ?? DEFAULT_SETTINGS.notificationEmail,
      notificationInApp: args.notificationInApp ?? DEFAULT_SETTINGS.notificationInApp,
      mentionSetting: args.mentionSetting ?? DEFAULT_SETTINGS.mentionSetting,
      tagSetting: args.tagSetting ?? DEFAULT_SETTINGS.tagSetting,
      archiveEvents: args.archiveEvents ?? DEFAULT_SETTINGS.archiveEvents,
    })
  },
})
