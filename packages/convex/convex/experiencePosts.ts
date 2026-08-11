import { v } from 'convex/values'
import { query, mutation, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUser } from './helpers'
import { rateLimiter } from './rateLimiter'

const MAX_CONTENT_LENGTH = 2000

async function enrichPost(ctx: QueryCtx, post: Doc<'experiencePosts'>) {
  const author = await ctx.db.get('profiles', post.userId)
  let imageUrl = post.imageUrl
  if (!imageUrl && post.imageStorageId) {
    imageUrl = (await ctx.storage.getUrl(post.imageStorageId as Id<'_storage'>)) ?? undefined
  }
  let event: Doc<'events'> | null = null
  if (post.eventId) {
    const e = await ctx.db.get('events', post.eventId)
    if (e && e.status === 'published') event = e
  }
  return {
    id: post._id,
    userId: post.userId,
    author: author
      ? {
          id: author._id,
          fullName: author.fullName ?? 'Anonymous',
          avatarUrl: author.avatarUrl,
        }
      : null,
    eventId: post.eventId,
    event: event ? { id: event._id, title: event.title, slug: event.slug } : null,
    content: post.content,
    imageUrl,
    createdAt: post._creationTime,
  }
}

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 20), 50)
    const posts = await ctx.db.query('experiencePosts').order('desc').take(limit)
    const visible = posts.filter((p) => !p.isDeleted)
    return await Promise.all(visible.map((p) => enrichPost(ctx, p)))
  },
})

export const listByUser = query({
  args: { profileId: v.id('profiles'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 20), 50)
    const posts = await ctx.db
      .query('experiencePosts')
      .withIndex('by_user', (q) => q.eq('userId', args.profileId))
      .order('desc')
      .take(limit)
    const visible = posts.filter((p) => !p.isDeleted)
    return await Promise.all(visible.map((p) => enrichPost(ctx, p)))
  },
})

export const listByEvent = query({
  args: { eventId: v.id('events'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 10), 20)
    const posts = await ctx.db
      .query('experiencePosts')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .order('desc')
      .take(limit)
    const visible = posts.filter((p) => !p.isDeleted)
    return await Promise.all(visible.map((p) => enrichPost(ctx, p)))
  },
})

export const getById = query({
  args: { postId: v.id('experiencePosts') },
  handler: async (ctx, args) => {
    const post = await ctx.db.get('experiencePosts', args.postId)
    if (!post || post.isDeleted) return null
    return await enrichPost(ctx, post)
  },
})

export const create = mutation({
  args: {
    content: v.string(),
    eventId: v.optional(v.id('events')),
    imageStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'experiencePostCreate', {
      key: profile._id,
      throws: true,
    })

    const content = args.content.trim()
    if (content.length < 3) throw new Error('Post content is too short')
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`Post content exceeds ${MAX_CONTENT_LENGTH} characters`)
    }

    if (args.eventId) {
      const event = await ctx.db.get('events', args.eventId)
      if (!event) throw new Error('Event not found')
    }

    let imageUrl: string | undefined
    if (args.imageStorageId) {
      imageUrl = (await ctx.storage.getUrl(args.imageStorageId as Id<'_storage'>)) ?? undefined
    }

    return await ctx.db.insert('experiencePosts', {
      userId: profile._id,
      eventId: args.eventId,
      content,
      imageStorageId: args.imageStorageId,
      imageUrl,
      isDeleted: false,
    })
  },
})

export const remove = mutation({
  args: { postId: v.id('experiencePosts') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const post = await ctx.db.get('experiencePosts', args.postId)
    if (!post) throw new Error('Post not found')
    if (post.userId !== profile._id) throw new Error('Not authorized')
    await ctx.db.patch('experiencePosts', args.postId, { isDeleted: true })
  },
})
