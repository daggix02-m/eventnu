import { v } from 'convex/values'
import { query } from '../_generated/server'
import { Doc, Id } from '../_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { requireAdmin, requireUser } from '../helpers'
import { enrichEvent, getEventCategoryLinks, getEventImages, resolveImageUrls } from './enrichment'

export const getPublished = query({
  args: {},
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query('events')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(100)
    return await Promise.all(events.map((e) => enrichEvent(ctx, e)))
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
    return await Promise.all(upcoming.map((e) => enrichEvent(ctx, e)))
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
    return enrichEvent(ctx, event, true)
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

    return await Promise.all(published.map((e) => enrichEvent(ctx, e)))
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
    return await Promise.all(published.map(({ event }) => enrichEvent(ctx, event)))
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
    const { paginationOpts, ...filters } = args
    const q = filters.search?.trim().toLowerCase()

    const page = filters.status
      ? await ctx.db
          .query('events')
          .withIndex('by_status', (q) => q.eq('status', filters.status as Doc<'events'>['status']))
          .order('desc')
          .paginate(paginationOpts)
      : await ctx.db.query('events').order('desc').paginate(paginationOpts)

    let pageItems = page.page
    if (filters.source) {
      pageItems = pageItems.filter((e) => e.source === filters.source)
    }
    if (filters.featured !== undefined) {
      pageItems = pageItems.filter((e) => e.isFeatured === filters.featured)
    }
    if (filters.frequency) {
      pageItems = pageItems.filter((e) => e.frequencyType === filters.frequency)
    }
    if (q) {
      pageItems = pageItems.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)),
      )
    }
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
    let total = 0
    let totalPublished = 0
    let upcoming = 0
    let pending = 0
    let cursor: string | null = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db.query('events').order('desc').paginate({ cursor, numItems: 500 })
      for (const e of page.page) {
        total++
        if (e.status === 'published') totalPublished++
        if (e.startDate >= args.now) upcoming++
        if (e.status === 'pending_review') pending++
      }
      if (page.isDone) break
      cursor = page.continueCursor
    }
    return { total, totalPublished, upcoming, pending }
  },
})
