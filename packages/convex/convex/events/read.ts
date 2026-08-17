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
    const limit = args.limit ?? 5
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
    const event = await ctx.db
      .query('events')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique()
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

    if (!q) return page
    const pageItems = page.page.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)),
    )
    return { ...page, page: pageItems }
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

export const listByHost = query({
  args: { hostId: v.id('hosts'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(Math.max(1, args.limit ?? 20), 100)
    return await ctx.db
      .query('events')
      .withIndex('by_host', (q) => q.eq('hostId', args.hostId))
      .order('desc')
      .take(limit)
  },
})

export const listByOrganizer = query({
  args: { profileId: v.id('profiles'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(Math.max(1, args.limit ?? 20), 100)
    return await ctx.db
      .query('events')
      .withIndex('by_organizer', (q) => q.eq('organizerId', args.profileId))
      .order('desc')
      .take(limit)
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
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireUser(ctx)
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
