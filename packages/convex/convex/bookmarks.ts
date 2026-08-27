import { v } from 'convex/values'
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { getUserProfile, requireUser, incrementEngagementCounter } from './helpers'
import { enrichPublicEvents } from './events/enrichment'
import { rateLimiter } from './rateLimiter'

/**
 * System-default saved-event categories (the "Events to Go To" template).
 * Seeded lazily and idempotently per user so existing accounts pick them up
 * without a migration. `isDefault` marks the template as user-visible system
 * categories; users can still add their own custom folders.
 */
const SYSTEM_DEFAULT_FOLDERS: ReadonlyArray<{ name: string; emoji: string }> = [
  { name: 'Events to Go To', emoji: '🎯' },
]

async function ensureDefaultFolders(ctx: MutationCtx, userId: Id<'profiles'>) {
  for (const template of SYSTEM_DEFAULT_FOLDERS) {
    const existing = await ctx.db
      .query('bookmarkFolders')
      .withIndex('by_user_and_name', (q) => q.eq('userId', userId).eq('name', template.name))
      .first()
    if (existing) continue
    await ctx.db.insert('bookmarkFolders', {
      userId,
      name: template.name,
      kind: 'system',
      isDefault: true,
      emoji: template.emoji,
    })
  }
}

export const countByEvent = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const event = await ctx.db.get('events', args.eventId)
    return event?.bookmarkCount ?? 0
  },
})

export const hasBookmarked = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    if (!profile) return false
    const bookmark = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_userId_and_eventId', (q) =>
        q.eq('userId', profile._id).eq('eventId', args.eventId),
      )
      .first()
    return !!bookmark
  },
})

/**
 * Bulk variant of `hasBookmarked`: returns a map of `eventId -> true` for the
 * requested events the current user has bookmarked. Collapses N per-card
 * subscriptions into a single query for list pages.
 */
export const hasBookmarkedBulk = query({
  args: { eventIds: v.array(v.id('events')) },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    const result: Record<string, boolean> = {}
    if (!profile || args.eventIds.length === 0) return result
    const wanted = new Set(args.eventIds)
    const bookmarks = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('desc')
      .take(1000)
    for (const bookmark of bookmarks) {
      if (wanted.has(bookmark.eventId)) result[bookmark.eventId] = true
    }
    return result
  },
})

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    const bookmarks = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('desc')
      .take(200)
    const events = await Promise.all(bookmarks.map((b) => ctx.db.get('events', b.eventId)))
    return await enrichPublicEvents(
      ctx,
      events.filter((e): e is Doc<'events'> => !!e && e.status === 'published'),
    )
  },
})

export const listFolders = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    return await ctx.db
      .query('bookmarkFolders')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('asc')
      .take(100)
  },
})
export const listByFolder = query({
  args: { folderId: v.optional(v.id('bookmarkFolders')) },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    if (args.folderId) {
      const folder = await ctx.db.get('bookmarkFolders', args.folderId)
      if (!folder || folder.userId !== profile._id) throw new Error('Folder not found')
    }
    const bookmarks = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('desc')
      .take(200)
    const matchingBookmarks = args.folderId
      ? bookmarks.filter((bookmark) => bookmark.folderId === args.folderId)
      : bookmarks.filter((bookmark) => bookmark.folderId === undefined)
    const events = await Promise.all(matchingBookmarks.map((b) => ctx.db.get('events', b.eventId)))
    return await enrichPublicEvents(
      ctx,
      events.filter((e): e is Doc<'events'> => !!e && e.status === 'published'),
    )
  },
})

export const createFolder = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    await ensureDefaultFolders(ctx, profile._id)
    const name = args.name.trim()
    if (!name || name.length > 60) throw new Error('Folder name must be 1 to 60 characters')
    const existing = await ctx.db
      .query('bookmarkFolders')
      .withIndex('by_user_and_name', (q) => q.eq('userId', profile._id).eq('name', name))
      .first()
    if (existing) return existing._id
    return await ctx.db.insert('bookmarkFolders', {
      userId: profile._id,
      name,
      kind: 'custom',
    })
  },
})

export const renameFolder = mutation({
  args: { folderId: v.id('bookmarkFolders'), name: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const folder = await ctx.db.get('bookmarkFolders', args.folderId)
    if (!folder || folder.userId !== profile._id) throw new Error('Folder not found')
    const name = args.name.trim()
    if (!name || name.length > 60) throw new Error('Folder name must be 1 to 60 characters')
    const existing = await ctx.db
      .query('bookmarkFolders')
      .withIndex('by_user_and_name', (q) => q.eq('userId', profile._id).eq('name', name))
      .first()
    if (existing && existing._id !== folder._id) throw new Error('Folder already exists')
    await ctx.db.patch('bookmarkFolders', folder._id, { name })
  },
})

export const deleteFolder = mutation({
  args: { folderId: v.id('bookmarkFolders') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const folder = await ctx.db.get('bookmarkFolders', args.folderId)
    if (!folder || folder.userId !== profile._id) throw new Error('Folder not found')
    const bookmarks = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_user_and_folder', (q) =>
        q.eq('userId', profile._id).eq('folderId', folder._id),
      )
      .take(500)
    for (const bookmark of bookmarks) {
      await ctx.db.patch('eventBookmarks', bookmark._id, { folderId: undefined })
    }
    await ctx.db.delete('bookmarkFolders', folder._id)
  },
})

export const moveToFolder = mutation({
  args: {
    eventId: v.id('events'),
    folderId: v.optional(v.id('bookmarkFolders')),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    if (args.folderId) {
      const folder = await ctx.db.get('bookmarkFolders', args.folderId)
      if (!folder || folder.userId !== profile._id) throw new Error('Folder not found')
    }
    const bookmark = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_userId_and_eventId', (q) =>
        q.eq('userId', profile._id).eq('eventId', args.eventId),
      )
      .first()
    if (!bookmark) throw new Error('Event is not bookmarked')
    await ctx.db.patch('eventBookmarks', bookmark._id, { folderId: args.folderId })
  },
})

export const toggle = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const userId = profile._id
    await rateLimiter.limit(ctx, 'bookmarkToggle', { key: userId, throws: true })
    await ensureDefaultFolders(ctx, userId)

    const event = await ctx.db.get('events', args.eventId)
    if (!event) throw new Error('Event not found')

    const existing = await ctx.db
      .query('eventBookmarks')
      .withIndex('by_userId_and_eventId', (q) => q.eq('userId', userId).eq('eventId', args.eventId))
      .first()
    if (existing) {
      await ctx.db.delete('eventBookmarks', existing._id)
      await incrementEngagementCounter(ctx, userId, 'bookmarks', -1)
      await ctx.db.patch('events', args.eventId, {
        bookmarkCount: Math.max(0, (event.bookmarkCount ?? 0) - 1),
      })
      return false
    } else {
      await ctx.db.insert('eventBookmarks', {
        userId,
        eventId: args.eventId,
      })
      await incrementEngagementCounter(ctx, userId, 'bookmarks', 1)
      await ctx.db.patch('events', args.eventId, {
        bookmarkCount: (event.bookmarkCount ?? 0) + 1,
      })
      return true
    }
  },
})
