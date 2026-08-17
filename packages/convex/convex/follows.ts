import { v } from 'convex/values'
import { query, mutation, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUser } from './helpers'
import { rateLimiter } from './rateLimiter'

export const listByFollower = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    return await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', profile._id))
      .take(200)
  },
})

export const countByFollower = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', profile._id))
      .take(500)
    return follows.length
  },
})

export const listFollowers = query({
  args: {
    followingId: v.id('profiles'),
    followType: v.union(v.literal('organizer'), v.literal('user')),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_following', (q) => q.eq('followingId', args.followingId))
      .take(200)
    const filtered = follows.filter((f) => f.followType === args.followType)
    const profiles = await Promise.all(filtered.map((f) => ctx.db.get('profiles', f.followerId)))
    return profiles
      .filter((p): p is Doc<'profiles'> => p !== null)
      .map((p) => ({ id: p._id, fullName: p.fullName ?? null, avatarUrl: p.avatarUrl ?? null }))
  },
})

async function adjustFollowerCount(
  ctx: MutationCtx,
  followingId: Id<'profiles'>,
  followType: string,
  delta: 1 | -1,
): Promise<void> {
  if (followType === 'organizer') {
    const org = await ctx.db.get(
      'organizerProfiles',
      followingId as unknown as Id<'organizerProfiles'>,
    )
    if (org) {
      await ctx.db.patch('organizerProfiles', org._id, {
        followerCount: Math.max(0, org.followerCount + delta),
      })
    }
  } else if (followType === 'user') {
    const user = await ctx.db.get('profiles', followingId)
    if (user) {
      await ctx.db.patch('profiles', user._id, {
        followerCount: Math.max(0, user.followerCount + delta),
      })
    }
  }
}

export const toggle = mutation({
  args: {
    followingId: v.id('profiles'),
    followType: v.union(v.literal('organizer'), v.literal('user')),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'followToggle', { key: profile._id, throws: true })
    const existing = await ctx.db
      .query('follows')
      .withIndex('by_followerId_and_followingId', (q) =>
        q.eq('followerId', profile._id).eq('followingId', args.followingId),
      )
      .take(10)
    const match = existing.find((f) => f.followType === args.followType)
    if (match) {
      await ctx.db.delete('follows', match._id)
      await adjustFollowerCount(ctx, args.followingId, args.followType, -1)
      return false
    }
    await ctx.db.insert('follows', {
      followerId: profile._id,
      followingId: args.followingId,
      followType: args.followType,
    })
    await adjustFollowerCount(ctx, args.followingId, args.followType, 1)
    return true
  },
})
