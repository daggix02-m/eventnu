import { v } from 'convex/values'
import { query, mutation, internalMutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import { insertModerationLog, requireAdmin, requireUser, getUserProfile } from './helpers'
import { rateLimiter } from './rateLimiter'
import { paginationOptsValidator } from 'convex/server'

const STORY_TTL_MS = 24 * 60 * 60 * 1000
const MAX_CAPTION_LENGTH = 500
// Retain expired stories privately for the owner for this long before purging
// the media blob. Metadata (and any owner-categorization) can be kept longer.
const STORY_RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

type StoryDoc = Doc<'stories'>

/** Server-local calendar key fallback when the client does not supply one. */
function fallbackDateKey(now: number): string {
  const d = new Date(now)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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
    dateKey: story.dateKey ?? fallbackDateKey(story._creationTime),
    thumbnailUrl: story.thumbnailUrl ?? null,
    latitude: story.latitude ?? null,
    longitude: story.longitude ?? null,
    placeName: story.placeName ?? null,
    categoryId: story.categoryId ?? null,
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

/** Batch profile enrichment — one index read per unique author, not per story. */
async function enrichStories(ctx: QueryCtx, stories: StoryDoc[]) {
  const profileIds = [...new Set(stories.map((s) => s.userId))]
  const authors = new Map(
    (await Promise.all(profileIds.map((id) => ctx.db.get('profiles', id))))
      .filter((p): p is Doc<'profiles'> => !!p)
      .map((p) => [p._id, p]),
  )
  return stories.map((story) => {
    const author = authors.get(story.userId)
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
      dateKey: story.dateKey ?? fallbackDateKey(story._creationTime),
      thumbnailUrl: story.thumbnailUrl ?? null,
      latitude: story.latitude ?? null,
      longitude: story.longitude ?? null,
      placeName: story.placeName ?? null,
      categoryId: story.categoryId ?? null,
      author: author
        ? {
            id: author._id,
            fullName: author.fullName ?? 'Anonymous',
            avatarUrl: author.avatarUrl ?? null,
            username: author.username ?? null,
          }
        : null,
    }
  })
}

export const publish = mutation({
  args: {
    kind: v.union(v.literal('photo'), v.literal('video')),
    mediaStorageId: v.string(),
    caption: v.optional(v.string()),
    eventId: v.optional(v.id('events')),
    dateKey: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    placeName: v.optional(v.string()),
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

    if (args.dateKey && !DATE_KEY_RE.test(args.dateKey)) {
      throw new Error('dateKey must be YYYY-MM-DD')
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

    let thumbnailUrl: string | undefined
    if (args.thumbnailStorageId) {
      const thumbMeta = await ctx.db.system.get(
        '_storage',
        args.thumbnailStorageId as Id<'_storage'>,
      )
      if (!thumbMeta) throw new Error('Thumbnail file not found')
      if (!(thumbMeta.contentType ?? '').startsWith('image/')) {
        throw new Error('Story thumbnail must be an image file')
      }
      const url = await ctx.storage.getUrl(args.thumbnailStorageId as Id<'_storage'>)
      if (!url) throw new Error('Thumbnail file not found')
      thumbnailUrl = url
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
      dateKey: args.dateKey ?? fallbackDateKey(Date.now()),
      thumbnailStorageId: args.thumbnailStorageId,
      thumbnailUrl,
      latitude: args.latitude,
      longitude: args.longitude,
      placeName: args.placeName,
      expired: false,
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
      page: await enrichStories(ctx, page.page),
    }
  },
})

const RAIL_MAX_AUTHORS = 15
const RAIL_MAX_STORIES_PER_AUTHOR = 6

/**
 * Lightweight rail summary — no full story docs, no per-story profile reads.
 * Returns per-author groups of the newest active stories so the home rail can
 * render gradient rings with just an avatar + a thumbnail + viewed state.
 */
export const listRail = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const viewer = await getUserProfile(ctx)
    const active = await ctx.db
      .query('stories')
      .withIndex('by_moderation', (q) => q.eq('moderationStatus', 'approved'))
      .order('desc')
      .take(RAIL_MAX_AUTHORS * RAIL_MAX_STORIES_PER_AUTHOR * 2)
    const visible = active.filter((s) => !s.isDeleted && (s.expiresAt ?? 0) >= args.now)

    const profileIds = [...new Set(visible.map((s) => s.userId))]
    const authors = new Map(
      (await Promise.all(profileIds.map((id) => ctx.db.get('profiles', id))))
        .filter((p): p is Doc<'profiles'> => !!p)
        .map((p) => [p._id, p]),
    )

    // Group newest-first, capping stories per author.
    const groups = new Map<Id<'profiles'>, StoryDoc[]>()
    for (const story of visible) {
      const list = groups.get(story.userId)
      if (list && list.length >= RAIL_MAX_STORIES_PER_AUTHOR) continue
      if (!list) groups.set(story.userId, [])
      groups.get(story.userId)!.push(story)
    }

    // Viewed state: which of the viewer's visible story ids have a view row.
    const viewedIds = new Set<string>()
    if (viewer) {
      for (const story of visible.slice(0, RAIL_MAX_STORIES_PER_AUTHOR * RAIL_MAX_AUTHORS)) {
        const row = await ctx.db
          .query('storyViews')
          .withIndex('by_storyId_and_viewerId', (q) =>
            q.eq('storyId', story._id).eq('viewerId', viewer._id),
          )
          .first()
        if (row) viewedIds.add(story._id)
      }
    }

    const rail: RailAuthorSummary[] = []
    for (const [authorId, stories] of groups) {
      if (rail.length >= RAIL_MAX_AUTHORS) break
      const author = authors.get(authorId)
      const storyIds = stories.map((s) => s._id)
      const hasUnviewed = stories.some((s) => !viewedIds.has(s._id))
      rail.push({
        authorId,
        authorName: author?.fullName ?? 'Anonymous',
        avatarUrl: author?.avatarUrl ?? null,
        username: author?.username ?? null,
        storyCount: storyIds.length,
        hasUnviewed,
        storyIds,
        latestThumbnailUrl: stories[0]?.thumbnailUrl ?? null,
        latestKind: stories[0]?.kind ?? 'photo',
      })
    }
    return rail
  },
})

export type RailAuthorSummary = {
  authorId: string
  authorName: string
  avatarUrl: string | null
  username: string | null
  storyCount: number
  hasUnviewed: boolean
  storyIds: string[]
  latestThumbnailUrl: string | null
  latestKind: 'photo' | 'video'
}

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
    return await enrichStories(ctx, visible)
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

// ── Owner-only "Past Events" archive ────────────────────────────────────────
// Expired stories are never visible publicly; these queries are hard-gated to
// the authenticated owner so the archive can only ever be read by its owner.

export const listPast = query({
  args: {
    paginationOpts: paginationOptsValidator,
    dateKey: v.optional(v.string()),
    categoryId: v.optional(v.id('storyCategories')),
    uncategorized: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const page = await ctx.db
      .query('stories')
      .withIndex('by_userId_and_expired', (q) => q.eq('userId', profile._id).eq('expired', true))
      .order('desc')
      .filter((q) => {
        const clauses = [q.not(q.eq(q.field('isDeleted'), true))]
        if (args.dateKey) clauses.push(q.eq(q.field('dateKey'), args.dateKey))
        if (args.uncategorized) clauses.push(q.eq(q.field('categoryId'), undefined))
        else if (args.categoryId) clauses.push(q.eq(q.field('categoryId'), args.categoryId))
        return q.and(...clauses)
      })
      .paginate(args.paginationOpts)
    return {
      ...page,
      page: await enrichStories(ctx, page.page),
    }
  },
})

/** Archive rows grouped by calendar day for a month-grid view. */
export const getPastByDate = query({
  args: {
    dateKey: v.string(),
    categoryId: v.optional(v.id('storyCategories')),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    if (!DATE_KEY_RE.test(args.dateKey)) throw new Error('dateKey must be YYYY-MM-DD')
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_userId_and_dateKey', (q) =>
        q.eq('userId', profile._id).eq('dateKey', args.dateKey),
      )
      .order('desc')
      .take(50)
    const visible = stories.filter(
      (s) =>
        !s.isDeleted &&
        s.expired === true &&
        (args.categoryId ? s.categoryId === args.categoryId : true),
    )
    return await enrichStories(ctx, visible)
  },
})

/** Count of past stories per month, used to dim empty calendar cells. */
export const countPast = query({
  args: { monthPrefix: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_userId_and_expired', (q) => q.eq('userId', profile._id).eq('expired', true))
      .take(1000)
    const counts: Record<string, number> = {}
    for (const s of stories) {
      const key = (s.dateKey ?? fallbackDateKey(s._creationTime)).slice(0, 7)
      if (key.startsWith(args.monthPrefix)) counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  },
})

/** Owner assigns a custom category to one of their past stories. */
export const setCategory = mutation({
  args: {
    storyId: v.id('stories'),
    categoryId: v.optional(v.id('storyCategories')),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const story = await ctx.db.get('stories', args.storyId)
    if (!story) throw new Error('Story not found')
    if (story.userId !== profile._id) throw new Error('Not authorized')
    if (args.categoryId) {
      const category = await ctx.db.get('storyCategories', args.categoryId)
      if (!category || category.userId !== profile._id) throw new Error('Category not found')
    }
    await ctx.db.patch('stories', args.storyId, { categoryId: args.categoryId })
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

export const listViews = query({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const story = await ctx.db.get('stories', args.storyId)
    if (!story) throw new Error('Story not found')
    // Any authenticated user can see who viewed a story (social proof).
    const views = await ctx.db
      .query('storyViews')
      .withIndex('by_story', (q) => q.eq('storyId', args.storyId))
      .order('desc')
      .take(100)
    const viewerIds = [...new Set(views.map((v) => v.viewerId))]
    const profiles = await Promise.all(viewerIds.map((id) => ctx.db.get('profiles', id)))
    const profileMap = new Map(
      profiles.filter((p): p is Doc<'profiles'> => !!p).map((p) => [p._id, p]),
    )
    return views.map((v) => {
      const p = profileMap.get(v.viewerId)
      return {
        viewerId: v.viewerId,
        viewedAt: v.viewedAt,
        fullName: p?.fullName ?? 'Anonymous',
        avatarUrl: p?.avatarUrl ?? null,
      }
    })
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
      if (story.expired === true) continue
      await ctx.db.patch('stories', story._id, { expired: true })
    }
  },
})

/**
 * Retention sweep: expired stories older than the retention window have their
 * media blob removed and the row deleted. Runs in bounded batches and
 * reschedules itself until the backlog is clear so each transaction stays
 * within limits.
 */
export const purgeExpiredMedia = internalMutation({
  args: { now: v.number(), batchId: v.optional(v.string()) },
  handler: async (ctx: MutationCtx, args) => {
    const cutoff = args.now - STORY_RETENTION_MS
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', cutoff))
      .take(200)
    if (stories.length === 0) return
    for (const story of stories) {
      if (story.mediaStorageId) {
        await ctx.storage.delete(story.mediaStorageId as Id<'_storage'>)
      }
      if (story.thumbnailStorageId) {
        await ctx.storage.delete(story.thumbnailStorageId as Id<'_storage'>)
      }
      await ctx.db.delete('stories', story._id)
    }
    await ctx.scheduler.runAfter(0, internal.stories.purgeExpiredMedia, {
      now: args.now,
    })
  },
})
