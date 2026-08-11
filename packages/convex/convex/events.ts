import { v } from 'convex/values'
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { paginationOptsValidator } from 'convex/server'
import {
  insertEventImages,
  insertModerationLog,
  patchDefined,
  replaceEventImages,
  requireAdmin,
  requireUser,
  uniqueSlug,
} from './helpers'
import { rateLimiter } from './rateLimiter'
import { MAX_EVENT_IMAGES } from './constants'

export const eventImageValidator = v.object({
  url: v.string(),
  storageId: v.optional(v.string()),
  filter: v.optional(v.string()),
})

async function getEventImages(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  return await ctx.db
    .query('eventImages')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .take(MAX_EVENT_IMAGES)
}

async function resolveImageUrls(ctx: QueryCtx | MutationCtx, images: Array<Doc<'eventImages'>>) {
  return Promise.all(
    images.map(async (img) => {
      if (img.storageId) {
        const url = await ctx.storage.getUrl(img.storageId as Id<'_storage'>)
        if (url) return { ...img, url }
      }
      return img
    }),
  )
}

async function getEventCategoryLinks(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  const rows = await ctx.db
    .query('eventCategories')
    .withIndex('by_event', (q) => q.eq('eventId', eventId))
    .take(20)
  return rows.sort((a, b) =>
    a.isPrimary === b.isPrimary ? a._creationTime - b._creationTime : a.isPrimary ? -1 : 1,
  )
}

export async function enrichEvent(ctx: QueryCtx, event: Doc<'events'>, includeOrganizer = false) {
  const links = await getEventCategoryLinks(ctx, event._id)
  const categories = await Promise.all(
    links.map((link) => ctx.db.get('categories', link.categoryId)),
  )
  const images = await resolveImageUrls(ctx, await getEventImages(ctx, event._id))
  const organizer =
    includeOrganizer && event.organizerId ? await ctx.db.get('profiles', event.organizerId) : null
  return {
    ...event,
    categories: categories.filter(Boolean),
    images,
    organizer,
    posterUrl: images[0]?.url ?? event.posterUrl,
  }
}

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
      .withIndex('by_featured', (q) => q.eq('isFeatured', true))
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
        .withIndex('by_category', (q) => q.eq('categoryId', categoryId))
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
      .withIndex('by_category', (q) => q.eq('categoryId', args.categoryId))
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
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { paginationOpts, page, ...filters } = args
    const numItems = Math.min(Math.max(1, paginationOpts.numItems || 20), 50)
    const offset = Math.max(0, (page ?? 1) - 1) * numItems

    const results = filters.status
      ? await ctx.db
          .query('events')
          .withIndex('by_status', (q) => q.eq('status', filters.status as any))
          .order('desc')
          .take(1000)
      : await ctx.db.query('events').order('desc').take(1000)
    let filtered = results
    if (filters.source) {
      filtered = filtered.filter((e) => e.source === filters.source)
    }
    if (filters.featured !== undefined) {
      filtered = filtered.filter((e) => e.isFeatured === filters.featured)
    }
    if (filters.frequency) {
      filtered = filtered.filter((e) => e.frequencyType === filters.frequency)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q)),
      )
    }
    const start = Math.min(offset, filtered.length)
    const pageItems = filtered.slice(start, start + numItems)
    return {
      page: pageItems,
      continueCursor: '',
      isDone: start + numItems >= filtered.length,
      totalCount: filtered.length,
    }
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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'uploadUrl', { key: profile._id, throws: true })
    return await ctx.storage.generateUploadUrl()
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
    const all = await ctx.db.query('events').take(1000)
    return {
      total: all.length,
      totalPublished: all.filter((e) => e.status === 'published').length,
      upcoming: all.filter((e) => e.startDate >= args.now).length,
      pending: all.filter((e) => e.status === 'pending_review').length,
    }
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
    imageAspectRatio: v.optional(v.string()),
    images: v.optional(v.array(eventImageValidator)),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    priceDisplay: v.optional(v.string()),
    actionType: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    status: v.optional(v.string()),
    hostId: v.optional(v.id('hosts')),
    organizerId: v.optional(v.id('profiles')),
    isStandalone: v.optional(v.boolean()),
    frequencyType: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    featuredSection: v.optional(v.string()),
    adminNote: v.optional(v.string()),
    venueMapLink: v.optional(v.string()),
    timezone: v.optional(v.string()),
    slug: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id('categories'))),
    teaserVideoUrl: v.optional(v.string()),
    videoAspectRatio: v.optional(v.string()),
    reservationLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)

    if (args.images && args.images.length > MAX_EVENT_IMAGES) {
      throw new Error(`Maximum ${MAX_EVENT_IMAGES} images allowed`)
    }
    const images = (args.images ?? []).slice(0, MAX_EVENT_IMAGES)

    const slug = args.slug ?? uniqueSlug(args.title)

    const eventId = await ctx.db.insert('events', {
      title: args.title,
      description: args.description ?? '',
      startDate: args.startDate,
      endDate: args.endDate ?? undefined,
      posterUrl: images[0]?.url ?? args.posterUrl ?? undefined,
      imageAspectRatio: args.imageAspectRatio ?? undefined,
      venueName: args.venueName ?? '',
      venueAddress: args.venueAddress ?? undefined,
      isFree: args.isFree ?? false,
      priceDisplay: args.priceDisplay ?? undefined,
      actionType: (args.actionType as any) ?? 'open_entry',
      externalLink: args.externalLink ?? undefined,
      externalLinkLabel: args.externalLinkLabel ?? undefined,
      contactEmail: args.contactEmail ?? undefined,
      status: (args.status as any) ?? 'draft',
      hostId: args.hostId ?? undefined,
      organizerId: args.organizerId ?? undefined,
      isStandalone: args.isStandalone ?? false,
      frequencyType: args.frequencyType ?? 'one_time',
      isFeatured: args.isFeatured ?? false,
      featuredSection: args.featuredSection ?? undefined,
      adminNote: args.adminNote ?? undefined,
      venueMapLink: args.venueMapLink ?? undefined,
      timezone: args.timezone ?? 'Africa/Addis_Ababa',
      slug,
      reservationCount: 0,
      teaserVideoUrl: args.teaserVideoUrl ?? undefined,
      videoAspectRatio: args.videoAspectRatio ?? undefined,
      subtitle: undefined,
      featuredUntil: undefined,
      reservationEnabled: args.actionType === 'reservation',
      reservationLimit: args.reservationLimit ?? undefined,
      likeCount: 0,
      bookmarkCount: 0,
      source: 'admin',
      venueLat: undefined,
      venueLng: undefined,
    })

    for (const [i, categoryId] of (args.categoryIds ?? []).entries()) {
      await ctx.db.insert('eventCategories', {
        eventId,
        categoryId,
        isPrimary: i === 0,
      })
    }

    await insertEventImages(ctx, eventId, images)

    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'create_event',
      targetType: 'event',
      targetId: eventId,
    })

    return eventId
  },
})

export const update = mutation({
  args: {
    eventId: v.id('events'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
    imageAspectRatio: v.optional(v.string()),
    images: v.optional(v.array(eventImageValidator)),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    priceDisplay: v.optional(v.string()),
    actionType: v.optional(v.string()),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    status: v.optional(v.string()),
    hostId: v.optional(v.id('hosts')),
    organizerId: v.optional(v.id('profiles')),
    isStandalone: v.optional(v.boolean()),
    frequencyType: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    featuredSection: v.optional(v.string()),
    featuredUntil: v.optional(v.number()),
    adminNote: v.optional(v.string()),
    venueMapLink: v.optional(v.string()),
    timezone: v.optional(v.string()),
    slug: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id('categories'))),
    teaserVideoUrl: v.optional(v.string()),
    videoAspectRatio: v.optional(v.string()),
    reservationLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const { eventId, images, categoryIds, ...fields } = args
    const updates = {
      ...patchDefined(fields),
      ...(fields.actionType !== undefined
        ? { reservationEnabled: fields.actionType === 'reservation' }
        : {}),
      ...(images ? { posterUrl: images[0]?.url ?? null } : {}),
    } as Partial<Doc<'events'>>
    if (images && images.length > MAX_EVENT_IMAGES) {
      throw new Error(`Maximum ${MAX_EVENT_IMAGES} images allowed`)
    }
    await ctx.db.patch('events', eventId, updates)

    if (categoryIds) {
      const existing = await ctx.db
        .query('eventCategories')
        .withIndex('by_event', (q) => q.eq('eventId', eventId))
        .take(50)
      for (const row of existing) {
        await ctx.db.delete('eventCategories', row._id)
      }
      for (const [i, categoryId] of categoryIds.entries()) {
        await ctx.db.insert('eventCategories', {
          eventId,
          categoryId,
          isPrimary: i === 0,
        })
      }
    }

    if (images) {
      await replaceEventImages(ctx, eventId, images)
    }
    return eventId
  },
})

export const deleteEvent = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const event = await ctx.db.get('events', args.eventId)
    if (!event) throw new Error('Event not found')

    const images = await getEventImages(ctx, args.eventId)
    for (const img of images) {
      await ctx.db.delete('eventImages', img._id)
      if (img.storageId) await ctx.storage.delete(img.storageId)
    }
    for await (const row of ctx.db
      .query('eventLikes')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('eventLikes', row._id)
    }
    for await (const row of ctx.db
      .query('eventComments')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('eventComments', row._id)
    }
    for await (const row of ctx.db
      .query('eventBookmarks')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('eventBookmarks', row._id)
    }
    for await (const row of ctx.db
      .query('eventShares')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('eventShares', row._id)
    }
    for await (const row of ctx.db
      .query('experiencePosts')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('experiencePosts', row._id)
    }
    for await (const row of ctx.db
      .query('eventCategories')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('eventCategories', row._id)
    }
    for await (const row of ctx.db
      .query('reservationRequests')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))) {
      await ctx.db.delete('reservationRequests', row._id)
    }
    await ctx.db.delete('events', args.eventId)
  },
})

export const updateStatus = mutation({
  args: {
    eventId: v.id('events'),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      status: args.status as any,
      ...(args.note ? { adminNote: args.note } : {}),
    })
  },
})

export const bulkUpdateStatus = mutation({
  args: {
    eventIds: v.array(v.id('events')),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    for (const eventId of args.eventIds) {
      await ctx.db.patch('events', eventId, {
        status: args.status as any,
      })
    }
  },
})

export const feature = mutation({
  args: {
    eventId: v.id('events'),
    section: v.string(),
    until: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: true,
      featuredSection: args.section,
      featuredUntil: args.until ?? undefined,
    })
  },
})

export const unfeature = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('events', args.eventId, {
      isFeatured: false,
      featuredSection: undefined,
      featuredUntil: undefined,
    })
  },
})
