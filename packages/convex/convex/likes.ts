import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { getUserProfile, requireUser } from './helpers'
import { rateLimiter } from './rateLimiter'

export const countByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const event = await ctx.db.get('events', args.eventId)
    return event?.likeCount ?? 0
  },
})

export const hasLiked = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    if (!profile) return false
    const like = await ctx.db
      .query('eventLikes')
      .withIndex('by_userId_and_eventId', (q) =>
        q.eq('userId', profile._id).eq('eventId', args.eventId),
      )
      .first()
    return !!like
  },
})

export const toggle = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const userId = profile._id
    await rateLimiter.limit(ctx, 'likeToggle', { key: userId, throws: true })
    const existing = await ctx.db
      .query('eventLikes')
      .withIndex('by_userId_and_eventId', (q) => q.eq('userId', userId).eq('eventId', args.eventId))
      .first()
    if (existing) {
      await ctx.db.delete('eventLikes', existing._id)
      const event = await ctx.db.get('events', args.eventId)
      if (event) {
        await ctx.db.patch('events', args.eventId, {
          likeCount: Math.max(0, (event.likeCount ?? 0) - 1),
        })
      }
      return false
    } else {
      await ctx.db.insert('eventLikes', {
        userId,
        eventId: args.eventId,
      })
      const event = await ctx.db.get('events', args.eventId)
      if (event) {
        await ctx.db.patch('events', args.eventId, {
          likeCount: (event.likeCount ?? 0) + 1,
        })
      }
      return true
    }
  },
})
