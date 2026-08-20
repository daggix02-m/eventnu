import { v } from 'convex/values'
import { query } from '../_generated/server'
import { Doc, Id } from '../_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { requireAdmin, requireOrganizerOwner, requireUser } from '../helpers'
import { STATS_SCAN_CAP } from '../constants'
import {
  enrichPublicEvent,
  enrichPublicEvents,
  getEventCategoryLinks,
  getEventImages,
  resolveImageUrls,
} from './enrichment'

export const getPublished = query({
  args: {},
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(100)
    return await enrichPublicEvents(ctx, events)
  },
})

export const getFeatured = query({
  args: { startDate: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 5), 50)
    const events = await ctx.db
      .query('events')
      .withIndex('by_isFeatured_and_startDate', (q) => q.eq('isFeatured', true))
      .order('desc')
      .take(limit * 2)
    const upcoming = events
      .filter((e) => e.status === 'published' && e.startDate >= args.startDate)
      .slice(0, limit)
    return await enrichPublicEvents(ctx, upcoming)
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // .first() (not .unique()) so a legacy duplicate slug resolves to the most
    // recent match instead of throwing; write paths now enforce uniqueness.
    const event = await ctx.db
      .query('events')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .order('desc')
      .first()
    if (!event || event.status !== 'published') return null
    return enrichPublicEvent(ctx, event, true)
  },
})

export const getSimilar = query({
  args: { eventId: v.id('events'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3
    const event = await ctx.db.get('events', args.eventId)
    if (!event) return []

    const myLinks = await getEventCategoryLinks(ctx, args.eventId)
    const myCategoryIds = new Set(myLinks.map((link) => link.categoryId))

    const candidates = new Map<Id<'events'>, number>()
    for (const categoryId of myCategoryIds) {
      const rows = await ctx.db
        .query('eventCategories')
        .withIndex('by_categoryId_and_eventId', (q) => q.eq('categoryId', categoryId))
        .take(50)
      for (const row of rows) {
        if (row.eventId === args.eventId) continue
        candidates.set(row.eventId, (candidates.get(row.eventId) ?? 0) + 1)
      }
    }

    const rankedIds = [...candidates.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)
    const ranked = await Promise.all(rankedIds.map((id) => ctx.db.get('events', id)))
    const published = ranked.filter((e): e is Doc<'events'> => !!e && e.status === 'published')

    return await enrichPublicEvents(ctx, published)
  },
})

export const getByCategory = query({
  args: { categoryId: v.id('categories') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('eventCategories')
      .withIndex('by_categoryId_and_eventId', (q) => q.eq('categoryId', args.categoryId))
      .take(200)
    const events = await Promise.all(rows.map((row) => ctx.db.get('events', row.eventId)))
    const published = events
      .map((e, i) => ({ event: e, primary: rows[i].isPrimary }))
      .filter(
        (x): x is { event: Doc<'events'>; primary: boolean } =>
          !!x.event && x.event.status === 'published',
      )
      .sort((a, b) =>
        a.primary === b.primary ? a.event.startDate - b.event.startDate : a.primary ? -1 : 1,
      )
    return await enrichPublicEvents(
      ctx,
      published.map(({ event }) => event),
    )
  },
})

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    frequency: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { paginationOpts, status, source, featured, frequency, search } = args
    const q = search?.trim().toLowerCase()

    const base =
      status && status !== 'all'
        ? ctx.db
            .query('events')
            .withIndex('by_status', (ix) => ix.eq('status', status as Doc<'events'>['status']))
        : ctx.db.query('events')

    // Text search needs the full table, not just the current page — a
    // post-pagination substring filter would silently miss matches on later
    // pages. Run a search-index query for the search case and return it as a
    // single (relevance-ranked) page; the no-search path paginates the
    // filtered query below.
    if (q) {
      // Search both title and description indexes and merge (deduped) so a
      // search term matches the same fields the old post-pagination filter did.
      const byTitle = await ctx.db
        .query('events')
        .withSearchIndex('search_title', (ix) => {
          let f = ix.search('title', q)
          if (status && status !== 'all') f = f.eq('status', status as Doc<'events'>['status'])
          if (source) f = f.eq('source', source)
          if (featured !== undefined) f = f.eq('isFeatured', featured)
          if (frequency) f = f.eq('frequencyType', frequency)
          return f
        })
        .take(100)
      const byDescription = await ctx.db
        .query('events')
        .withSearchIndex('search_description', (ix) => {
          let f = ix.search('description', q)
          if (status && status !== 'all') f = f.eq('status', status as Doc<'events'>['status'])
          if (source) f = f.eq('source', source)
          if (featured !== undefined) f = f.eq('isFeatured', featured)
          if (frequency) f = f.eq('frequencyType', frequency)
          return f
        })
        .take(100)
      const seen = new Set<Id<'events'>>()
      const results: Doc<'events'>[] = []
      for (const e of byTitle) {
        if (!seen.has(e._id)) {
          seen.add(e._id)
          results.push(e)
        }
      }
      for (const e of byDescription) {
        if (!seen.has(e._id)) {
          seen.add(e._id)
          results.push(e)
        }
      }
      return { page: results, isDone: true, continueCursor: null }
    }

    const page = await base
      .order('desc')
      .filter((f) =>
        f.and(
          ...(source ? [f.eq(f.field('source'), source)] : []),
          ...(featured !== undefined ? [f.eq(f.field('isFeatured'), featured)] : []),
          ...(frequency ? [f.eq(f.field('frequencyType'), frequency)] : []),
        ),
      )
      .paginate(paginationOpts)

    return page
  },
})

export const getById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const event = await ctx.db.get('events', args.eventId)
    if (!event) return { event: null, categories: [], images: [] }
    const links = await getEventCategoryLinks(ctx, args.eventId)
    const categories = await Promise.all(
      links.map((link) => ctx.db.get('categories', link.categoryId)),
    )
    const images = await resolveImageUrls(ctx, await getEventImages(ctx, args.eventId))
    return {
      event: { ...event, posterUrl: images[0]?.url ?? event.posterUrl },
      categories: categories.filter(Boolean),
      images,
    }
  },
})

export const listByOwner = query({
  args: { ownerId: v.id('organizerProfiles'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(Math.max(1, args.limit ?? 20), 100)
    return await ctx.db
      .query('events')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .order('desc')
      .take(limit)
  },
})

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { organizer } = await requireOrganizerOwner(ctx)
    const limit = Math.min(Math.max(1, args.limit ?? 50), 200)
    return await ctx.db
      .query('events')
      .withIndex('by_owner', (q) => q.eq('ownerId', organizer._id))
      .order('desc')
      .take(limit)
  },
})

export const getStorageUrls = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const event = await ctx.db.get('events', args.eventId)
    if (!event) throw new Error('Event not found')
    if (event.status !== 'published') {
      // event.ownerId is an organizerProfiles ID; resolve from profile
      const org = await ctx.db
        .query('organizerProfiles')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .first()
      if (!org || event.ownerId !== org._id) {
        throw new Error('Not authorized')
      }
    }
    const images = await ctx.db
      .query('eventImages')
      .withIndex('by_eventId_and_sortOrder', (q) => q.eq('eventId', args.eventId))
      .take(10)
    return Promise.all(
      images
        .filter((img) => img.storageId)
        .map((img) => ctx.storage.getUrl(img.storageId as Id<'_storage'>)),
    )
  },
})

export const resolveStorageUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return Promise.all(
      args.storageIds.map((storageId) =>
        storageId ? ctx.storage.getUrl(storageId as Id<'_storage'>) : null,
      ),
    )
  },
})

export const getPendingReview = query({
  args: {},
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('events')
      .withIndex('by_status', (q) => q.eq('status', 'pending_review'))
      .take(20)
  },
})

export const getStats = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const [published, pending, all] = await Promise.all([
      ctx.db
        .query('events')
        .withIndex('by_status', (q) => q.eq('status', 'published'))
        .take(STATS_SCAN_CAP),
      ctx.db
        .query('events')
        .withIndex('by_status', (q) => q.eq('status', 'pending_review'))
        .take(STATS_SCAN_CAP),
      ctx.db.query('events').take(STATS_SCAN_CAP),
    ])
    return {
      total: all.length,
      totalPublished: published.length,
      upcoming: published.filter((e) => e.startDate >= args.now).length,
      pending: pending.length,
    }
  },
})
