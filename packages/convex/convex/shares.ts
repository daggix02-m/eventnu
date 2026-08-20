import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { getUserProfile, incrementEngagementCounter, requireUser } from './helpers'
import { rateLimiter } from './rateLimiter'

export const track = mutation({
  args: {
    eventId: v.id('events'),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'shareTrack', { key: profile._id, throws: true })
    await ctx.db.insert('eventShares', {
      eventId: args.eventId,
      userId: profile._id,
      platform: args.platform ?? undefined,
    })
    await incrementEngagementCounter(ctx, profile._id, 'shares', 1)
  },
})
