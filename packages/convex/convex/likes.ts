import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { getUserProfile, requireUser, incrementEngagementCounter } from './helpers'
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
      await incrementEngagementCounter(ctx, userId, 'likes', -1)
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
      await incrementEngagementCounter(ctx, userId, 'likes', 1)
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

/** Set a like state without toggling, which makes gesture retries safe. */
export const setLiked = mutation({
  args: { eventId: v.id('events'), liked: v.boolean() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'likeSet', { key: profile._id, throws: true })

    const existing = await ctx.db
      .query('eventLikes')
      .withIndex('by_userId_and_eventId', (q) =>
        q.eq('userId', profile._id).eq('eventId', args.eventId),
      )
      .first()

    if (args.liked && !existing) {
      await ctx.db.insert('eventLikes', { userId: profile._id, eventId: args.eventId })
      await incrementEngagementCounter(ctx, profile._id, 'likes', 1)
      const event = await ctx.db.get('events', args.eventId)
      if (event) await ctx.db.patch('events', args.eventId, { likeCount: event.likeCount + 1 })
    } else if (!args.liked && existing) {
      await ctx.db.delete('eventLikes', existing._id)
      await incrementEngagementCounter(ctx, profile._id, 'likes', -1)
      const event = await ctx.db.get('events', args.eventId)
      if (event) {
        await ctx.db.patch('events', args.eventId, {
          likeCount: Math.max(0, event.likeCount - 1),
        })
      }
    }

    return args.liked
  },
})
