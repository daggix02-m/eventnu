import { v } from 'convex/values'
import { query, QueryCtx } from '../_generated/server'
import { Doc, Id } from '../_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import { requireAdmin, requireOrganizerOwner, requireUser } from '../helpers'
import { STATS_SCAN_CAP } from '../constants'
import { getEventCategoryLinks, getEventImages, resolveImageUrls } from './enrichment'
import type { PublicEvent, PublicOrganizer } from './enrichment'

// ---------------------------------------------------------------------------
// Materialized-view enrichment helpers — replaces the N+1 fan-out in
// enrichment.ts for public reads. Single index scan + batch category lookup.
// ---------------------------------------------------------------------------

/**
 * Batch-resolve all category docs for a set of event IDs via a single
 * eventCategories query per event, then one batch categories lookup.
 */
async function batchResolveCategories(
  ctx: QueryCtx,
  eventIds: Id<'events'>[],
): Promise<Map<Id<'events'>, Array<Doc<'categories'>>>> {
  // Collect all category IDs across all events in a single pass.
  const catLinksByEvent = await Promise.all(
    eventIds.map(async (eventId) => {
      const rows = await ctx.db
        .query('eventCategories')
        .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', eventId))
        .take(20)
      return { eventId, rows }
    }),
  )

  const allCatIds = new Set<Id<'categories'>>()
  for (const { rows } of catLinksByEvent) {
    for (const row of rows) allCatIds.add(row.categoryId)
  }

  // Single batch fetch of all unique category documents.
  const catDocs = await Promise.all([...allCatIds].map((id) => ctx.db.get('categories', id)))
  const catById = new Map<Id<'categories'>, Doc<'categories'>>()
  for (const doc of catDocs) {
    if (doc) catById.set(doc._id, doc)
  }

  // Map back to per-event category arrays, preserving primary-first sort.
  const result = new Map<Id<'events'>, Array<Doc<'categories'>>>()
  for (const { eventId, rows } of catLinksByEvent) {
    const sorted = rows
      .sort((a, b) =>
        a.isPrimary === b.isPrimary ? a._creationTime - b._creationTime : a.isPrimary ? -1 : 1,
      )
      .map((r) => catById.get(r.categoryId))
      .filter((c): c is Doc<'categories'> => c !== undefined)
    result.set(eventId, sorted)
  }
  return result
}

type Card = Doc<'publicEventCards'>

function buildOrganizer(card: Card): PublicOrganizer | null {
  if (!card.organizerName) return null
  return {
    _id: card.eventId as any, // placeholder — we use organizerProfileId below
    fullName: card.organizerName,
    avatarUrl: undefined, // avatar is on profiles, not on the card
    verified: card.organizerVerified ?? false,
    handle: card.organizerHandle,
    logoUrl: card.organizerLogoUrl,
    followerCount: card.organizerFollowerCount ?? 0,
    _creationTime: card.createdAt,
  }
}

function cardToPublicEvent(
  card: Card,
  categories: Array<Doc<'categories'>>,
  images: Array<{ url: string; storageId?: string; filter?: string }> = [],
): PublicEvent {
  const organizerProfileId = card.organizerProfileId as Id<'organizerProfiles'> | undefined
  return {
    _id: card.eventId,
    _creationTime: card.createdAt,
    title: card.title,
    slug: card.slug,
    description: card.description,
    subtitle: card.subtitle,
    startDate: card.startDate,
    endDate: card.endDate,
    posterUrl: card.posterUrl,
    imageAspectRatio: card.imageAspectRatio,
    instaPermalink: card.instaPermalink,
    teaserVideoUrl: card.teaserVideoUrl,
    videoAspectRatio: card.videoAspectRatio,
    externalLink: card.externalLink,
    externalLinkLabel: card.externalLinkLabel,
    priceDisplay: card.priceDisplay,
    isFree: card.isFree,
    actionType: card.actionType,
    status: card.status,
    source: card.source,
    ownerId: organizerProfileId,
    isFeatured: card.isFeatured,
    venueName: card.venueName,
    venueAddress: card.venueAddress,
    venueMapLink: card.venueMapLink,
    venueLat: card.venueLat,
    venueLng: card.venueLng,
    likeCount: card.likeCount,
    reservationEnabled: card.reservationEnabled,
    reservationLimit: card.reservationLimit,
    reservationCount: card.reservationCount,
    timezone: card.timezone,
    categories,
    images: images as any,
    organizer: buildOrganizer(card),
    primaryCategoryId: categories[0]?._id,
  }
}

// ---------------------------------------------------------------------------
// Public read queries — all read from the materialized publicEventCards view.
// ---------------------------------------------------------------------------

export const getPublished = query({
  args: {},
  handler: async (ctx) => {
    const cards = await ctx.db
      .query('publicEventCards')
      .withIndex('by_status_and_startDate', (q) => q.eq('status', 'published'))
      .order('desc')
      .take(100)

    if (cards.length === 0) return []

    const catMap = await batchResolveCategories(
      ctx,
      cards.map((c) => c.eventId),
    )
    return cards.map((card) => cardToPublicEvent(card, catMap.get(card.eventId) ?? []))
  },
})

export const getFeatured = query({
  args: { startDate: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 5), 50)
    const cards = await ctx.db
      .query('publicEventCards')
      .withIndex('by_isFeatured_and_startDate', (q) => q.eq('isFeatured', true))
      .order('desc')
      .take(limit * 2)

    const upcoming = cards
      .filter((c) => c.status === 'published' && c.startDate >= args.startDate)
      .slice(0, limit)

    if (upcoming.length === 0) return []

    const catMap = await batchResolveCategories(
      ctx,
      upcoming.map((c) => c.eventId),
    )
    return upcoming.map((card) => cardToPublicEvent(card, catMap.get(card.eventId) ?? []))
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // .first() so a legacy duplicate slug resolves to the most recent match.
    const card = await ctx.db
      .query('publicEventCards')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .order('desc')
      .first()
    if (!card || card.status !== 'published') return null

    // Batch-resolve categories (single query for this one event).
    const catMap = await batchResolveCategories(ctx, [card.eventId])
    const categories = catMap.get(card.eventId) ?? []

    // Resolve image URLs from storage IDs (detail page needs all images).
    const images: Array<{ url: string; storageId?: string; filter?: string }> = []
    if (card.imageStorageIds && card.imageStorageIds.length > 0) {
      const urls = await Promise.all(
        card.imageStorageIds.map((sid) => ctx.storage.getUrl(sid as Id<'_storage'>)),
      )
      for (let i = 0; i < urls.length; i++) {
        if (urls[i]) {
          images.push({ url: urls[i]!, storageId: card.imageStorageIds[i] })
        }
      }
    }

    return cardToPublicEvent(card, categories, images)
  },
})

export const getSimilar = query({
  args: { eventId: v.id('events'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 3

    // Get the source event's category links.
    const myLinks = await getEventCategoryLinks(ctx, args.eventId)
    if (myLinks.length === 0) return []

    const myCategoryIds = new Set(myLinks.map((link) => link.categoryId))

    // Find candidate events via category overlap.
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

    // Rank by overlap count, take top N, batch-read from materialized view.
    const rankedIds = [...candidates.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)

    if (rankedIds.length === 0) return []

    const cards = await Promise.all(
      rankedIds.map((id) =>
        ctx.db
          .query('publicEventCards')
          .withIndex('by_eventId', (q) => q.eq('eventId', id))
          .first(),
      ),
    )
    const published = cards.filter((c): c is Card => c !== null && c.status === 'published')

    if (published.length === 0) return []

    const catMap = await batchResolveCategories(
      ctx,
      published.map((c) => c.eventId),
    )
    return published.map((card) => cardToPublicEvent(card, catMap.get(card.eventId) ?? []))
  },
})

export const getByCategory = query({
  args: { categoryId: v.id('categories') },
  handler: async (ctx, args) => {
    // Get event IDs for this category.
    const rows = await ctx.db
      .query('eventCategories')
      .withIndex('by_categoryId_and_eventId', (q) => q.eq('categoryId', args.categoryId))
      .take(200)

    if (rows.length === 0) return []

    // Batch-read cards from materialized view.
    const cards = await Promise.all(
      rows.map((row) =>
        ctx.db
          .query('publicEventCards')
          .withIndex('by_eventId', (q) => q.eq('eventId', row.eventId))
          .first(),
      ),
    )

    // Filter to published, pair with primary flag, sort primary-first.
    const published = cards
      .map((card, i) => ({ card, primary: rows[i].isPrimary }))
      .filter(
        (x): x is { card: Card; primary: boolean } =>
          x.card !== null && x.card.status === 'published',
      )
      .sort((a, b) =>
        a.primary === b.primary ? a.card.startDate - b.card.startDate : a.primary ? -1 : 1,
      )

    if (published.length === 0) return []

    const eventIds = published.map(({ card }) => card.eventId)
    const catMap = await batchResolveCategories(ctx, eventIds)
    return published.map(({ card }) => cardToPublicEvent(card, catMap.get(card.eventId) ?? []))
  },
})

// ---------------------------------------------------------------------------
// Admin queries — unchanged; these deal with all statuses and admin-only data.
// ---------------------------------------------------------------------------

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

    if (q) {
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
  handler: async (ctx) => {
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
