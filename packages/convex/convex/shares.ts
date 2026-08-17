import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getUserProfile, incrementEngagementCounter } from './helpers'
import { rateLimiter } from './rateLimiter'

export const track = mutation({
  args: {
    eventId: v.id('events'),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    const key = profile?._id ?? args.eventId
    await rateLimiter.limit(ctx, 'shareTrack', { key, throws: true })
    await ctx.db.insert('eventShares', {
      eventId: args.eventId,
      userId: profile?._id,
      platform: args.platform ?? undefined,
    })
    if (profile) {
      await incrementEngagementCounter(ctx, profile._id, 'shares', 1)
    }
  },
})
