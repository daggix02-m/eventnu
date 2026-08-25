import { v } from 'convex/values'
import { query, mutation, MutationCtx } from './_generated/server'
import { Id } from './_generated/dataModel'
import { getUserProfile, requireUser, incrementEngagementCounter } from './helpers'
import { rateLimiter } from './rateLimiter'
import { LIKE_COUNT_SHARDS } from './constants'

export const countByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const shards = await ctx.db
      .query('likeCountShards')
      .withIndex('by_eventId_and_shard', (q) => q.eq('eventId', args.eventId))
      .take(LIKE_COUNT_SHARDS)
    return shards.reduce((sum, s) => sum + s.count, 0)
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

/**
 * Bulk variant of `hasLiked`: returns a map of `eventId -> true` for the
 * requested events the current user has liked. Collapses N per-card
 * subscriptions into a single query for list pages.
 */
export const hasLikedBulk = query({
  args: { eventIds: v.array(v.id('events')) },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    const result: Record<string, boolean> = {}
    if (!profile || args.eventIds.length === 0) return result
    const wanted = new Set(args.eventIds)
    const likes = await ctx.db
      .query('eventLikes')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('desc')
      .take(1000)
    for (const like of likes) {
      if (wanted.has(like.eventId)) result[like.eventId] = true
    }
    return result
  },
})

/**
 * Ensure the sharded counter rows exist for an event. Idempotent per shard:
 * each shard index is created only if missing, so concurrent first-likes on a
 * brand-new event cannot create duplicate shards. The first shard seeds the
 * legacy `events.likeCount` value once.
 */
async function ensureShardsExist(ctx: MutationCtx, eventId: Id<'events'>) {
  const event = await ctx.db.get('events', eventId)
  const seed = event?.likeCount ?? 0

  for (let i = 0; i < LIKE_COUNT_SHARDS; i++) {
    const existing = await ctx.db
      .query('likeCountShards')
      .withIndex('by_eventId_and_shard', (q) => q.eq('eventId', eventId).eq('shard', i))
      .first()
    if (!existing) {
      await ctx.db.insert('likeCountShards', {
        eventId,
        shard: i,
        count: i === 0 ? seed : 0,
      })
    }
  }
}

/**
 * Increment a pseudo-random shard by `delta`. This is the hot write path: N
 * shards per event distribute concurrent likes across separate documents so
 * they don't serialize on a single counter row.
 */
async function incrementShard(ctx: MutationCtx, eventId: Id<'events'>, delta: number) {
  await ensureShardsExist(ctx, eventId)
  const shard = Math.floor(Math.random() * LIKE_COUNT_SHARDS)
  const doc = await ctx.db
    .query('likeCountShards')
    .withIndex('by_eventId_and_shard', (q) => q.eq('eventId', eventId).eq('shard', shard))
    .first()
  if (doc) {
    await ctx.db.patch('likeCountShards', doc._id, { count: doc.count + delta })
  }
}

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
      await incrementShard(ctx, args.eventId, -1)
      return false
    } else {
      await ctx.db.insert('eventLikes', {
        userId,
        eventId: args.eventId,
      })
      await incrementEngagementCounter(ctx, userId, 'likes', 1)
      await incrementShard(ctx, args.eventId, 1)
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
      await incrementShard(ctx, args.eventId, 1)
    } else if (!args.liked && existing) {
      await ctx.db.delete('eventLikes', existing._id)
      await incrementEngagementCounter(ctx, profile._id, 'likes', -1)
      await incrementShard(ctx, args.eventId, -1)
    }

    return args.liked
  },
})
