import { v } from 'convex/values'
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { insertModerationLog, requireAdmin, requireUser } from './helpers'
import { rateLimiter } from './rateLimiter'
import { paginationOptsValidator } from 'convex/server'

const STORY_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CAPTION_LENGTH = 500

type StoryDoc = Doc<'stories'>

async function enrichStory(ctx: QueryCtx, story: StoryDoc) {
  const author = await ctx.db.get('profiles', story.userId)
  return {
    id: story._id,
    userId: story.userId,
    kind: story.kind,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType ?? null,
    caption: story.caption ?? null,
    eventId: story.eventId ?? null,
    createdAt: story._creationTime,
    expiresAt: story.expiresAt,
    author: author
      ? {
          id: author._id,
          fullName: author.fullName ?? 'Anonymous',
          avatarUrl: author.avatarUrl ?? null,
          username: author.username ?? null,
        }
      : null,
  }
}

export const publish = mutation({
  args: {
    kind: v.union(v.literal('photo'), v.literal('video')),
    mediaStorageId: v.string(),
    caption: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'storyPublish', { key: profile._id, throws: true })

    const caption = (args.caption ?? '').trim()
    if (caption.length > MAX_CAPTION_LENGTH) {
      throw new Error('Caption must be 500 characters or fewer')
    }

    if (args.eventId) {
      const event = await ctx.db.get('events', args.eventId)
      if (!event) throw new Error('Event not found')
    }

    const meta = await ctx.db.system.get('_storage', args.mediaStorageId as Id<'_storage'>)
    if (!meta) throw new Error('Uploaded file not found')
    const contentType = meta.contentType ?? ''
    if (args.kind === 'photo' && !contentType.startsWith('image/')) {
      throw new Error('Story photo must be an image file')
    }
    if (args.kind === 'video' && !contentType.startsWith('video/')) {
      throw new Error('Story video must be a video file')
    }

    const mediaUrl = await ctx.storage.getUrl(args.mediaStorageId as Id<'_storage'>)
    if (!mediaUrl) throw new Error('Uploaded file not found')

    return await ctx.db.insert('stories', {
      userId: profile._id,
      kind: args.kind,
      mediaStorageId: args.mediaStorageId,
      mediaUrl,
      mediaType: contentType || undefined,
      caption: caption.length > 0 ? caption : undefined,
      eventId: args.eventId,
      isDeleted: false,
      expiresAt: Date.now() + STORY_TTL_MS,
      moderationStatus: 'approved',
    })
  },
})

export const listActive = query({
  args: {
    paginationOpts: paginationOptsValidator,
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('stories')
      .withIndex('by_moderation', (q) => q.eq('moderationStatus', 'approved'))
      .order('desc')
      .filter((q) =>
        q.and(q.gte(q.field('expiresAt'), args.now), q.not(q.eq(q.field('isDeleted'), true))),
      )
      .paginate(args.paginationOpts)
    return {
      ...page,
      page: await Promise.all(page.page.map((story) => enrichStory(ctx, story))),
    }
  },
})

export const listByUser = query({
  args: {
    profileId: v.id('profiles'),
    now: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 20), 50)
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_user', (q) => q.eq('userId', args.profileId))
      .order('desc')
      .take(limit)
    const visible = stories.filter(
      (s) => !s.isDeleted && s.moderationStatus === 'approved' && s.expiresAt >= args.now,
    )
    return await Promise.all(visible.map((story) => enrichStory(ctx, story)))
  },
})

export const getById = query({
  args: { storyId: v.id('stories'), now: v.number() },
  handler: async (ctx, args) => {
    const story = await ctx.db.get('stories', args.storyId)
    if (!story || story.isDeleted || story.moderationStatus !== 'approved') return null
    if (story.expiresAt < args.now) return null
    return await enrichStory(ctx, story)
  },
})

export const remove = mutation({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const story = await ctx.db.get('stories', args.storyId)
    if (!story) throw new Error('Story not found')
    if (story.userId !== profile._id && profile.role !== 'admin') {
      throw new Error('Not authorized')
    }
    if (story.isDeleted) return // idempotent
    await ctx.db.patch('stories', args.storyId, { isDeleted: true })
  },
})

export const markViewed = mutation({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'storyView', { key: profile._id, throws: true })
    const existing = await ctx.db
      .query('storyViews')
      .withIndex('by_storyId_and_viewerId', (q) =>
        q.eq('storyId', args.storyId).eq('viewerId', profile._id),
      )
      .first()
    if (existing) return false
    await ctx.db.insert('storyViews', {
      storyId: args.storyId,
      viewerId: profile._id,
      viewedAt: Date.now(),
    })
    return true
  },
})

export const countViews = query({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const story = await ctx.db.get('stories', args.storyId)
    if (!story) throw new Error('Story not found')
    if (story.userId !== profile._id && profile.role !== 'admin') {
      throw new Error('Not authorized')
    }
    const views = await ctx.db
      .query('storyViews')
      .withIndex('by_story', (q) => q.eq('storyId', args.storyId))
      .take(1000)
    return views.length
  },
})

export const moderate = mutation({
  args: {
    storyId: v.id('stories'),
    status: v.union(v.literal('approved'), v.literal('rejected')),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const story = await ctx.db.get('stories', args.storyId)
    if (!story) throw new Error('Story not found')
    await ctx.db.patch('stories', args.storyId, { moderationStatus: args.status })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: args.status === 'rejected' ? 'reject_story' : 'approve_story',
      targetType: 'story',
      targetId: args.storyId,
    })
  },
})

export const expireStories = internalMutation({
  args: { now: v.number() },
  handler: async (ctx: MutationCtx, args) => {
    const expired = await ctx.db
      .query('stories')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', args.now))
      .take(500)
    for (const story of expired) {
      await ctx.db.delete('stories', story._id)
      await ctx.storage.delete(story.mediaStorageId as Id<'_storage'>)
    }
  },
})
