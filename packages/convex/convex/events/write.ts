import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { Doc } from '../_generated/dataModel'
import {
  insertEventImages,
  insertModerationLog,
  patchDefined,
  replaceEventImages,
  requireAdmin,
  requireOrganizerOwner,
  requireUser,
  uniqueSlug,
  validateUrl,
} from '../helpers'
import { rateLimiter } from '../rateLimiter'
import { MAX_EVENT_IMAGES } from '../constants'
import { eventImageValidator, getEventImages } from './enrichment'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    await rateLimiter.limit(ctx, 'uploadUrl', { key: profile._id, throws: true })
    return await ctx.storage.generateUploadUrl()
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
    actionType: v.optional(
      v.union(
        v.literal('open_entry'),
        v.literal('reservation'),
        v.literal('external_link'),
        v.literal('contact'),
      ),
    ),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('pending_review'),
        v.literal('published'),
        v.literal('rejected'),
        v.literal('cancelled'),
        v.literal('archived'),
      ),
    ),
    ownerId: v.optional(v.id('organizerProfiles')),
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
    if (args.externalLink) validateUrl(args.externalLink, 'External link')
    if (args.venueMapLink) validateUrl(args.venueMapLink, 'Venue map link')
    if (args.teaserVideoUrl) validateUrl(args.teaserVideoUrl, 'Teaser video URL')
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
      actionType: (args.actionType ?? 'open_entry') as Doc<'events'>['actionType'],
      externalLink: args.externalLink ?? undefined,
      externalLinkLabel: args.externalLinkLabel ?? undefined,
      contactEmail: args.contactEmail ?? undefined,
      status: (args.status ?? 'draft') as Doc<'events'>['status'],
      ownerId: args.ownerId ?? undefined,
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
    actionType: v.optional(
      v.union(
        v.literal('open_entry'),
        v.literal('reservation'),
        v.literal('external_link'),
        v.literal('contact'),
      ),
    ),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('draft'),
        v.literal('pending_review'),
        v.literal('published'),
        v.literal('rejected'),
        v.literal('cancelled'),
        v.literal('archived'),
      ),
    ),
    ownerId: v.optional(v.id('organizerProfiles')),
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
    if (fields.externalLink) validateUrl(fields.externalLink, 'External link')
    if (fields.venueMapLink) validateUrl(fields.venueMapLink, 'Venue map link')
    if (fields.teaserVideoUrl) validateUrl(fields.teaserVideoUrl, 'Teaser video URL')
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
        .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', eventId))
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
      .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', args.eventId))) {
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

const ORGANIZER_ACTION_TYPE = v.union(
  v.literal('open_entry'),
  v.literal('reservation'),
  v.literal('external_link'),
  v.literal('contact'),
)

export const createSelf = mutation({
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
    venueMapLink: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    priceDisplay: v.optional(v.string()),
    actionType: v.optional(ORGANIZER_ACTION_TYPE),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    timezone: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.id('categories'))),
    reservationLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizer } = await requireOrganizerOwner(ctx)
    await rateLimiter.limit(ctx, 'eventCreate', { key: organizer._id, throws: true })

    if (args.images && args.images.length > MAX_EVENT_IMAGES) {
      throw new Error(`Maximum ${MAX_EVENT_IMAGES} images allowed`)
    }
    if (args.externalLink) validateUrl(args.externalLink, 'External link')
    if (args.venueMapLink) validateUrl(args.venueMapLink, 'Venue map link')
    const images = (args.images ?? []).slice(0, MAX_EVENT_IMAGES)
    const slug = uniqueSlug(args.title)

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
      actionType: (args.actionType ?? 'open_entry') as Doc<'events'>['actionType'],
      externalLink: args.externalLink ?? undefined,
      externalLinkLabel: args.externalLinkLabel ?? undefined,
      contactEmail: args.contactEmail ?? undefined,
      status: 'pending_review',
      ownerId: organizer._id,
      isStandalone: false,
      frequencyType: 'one_time',
      isFeatured: false,
      featuredSection: undefined,
      adminNote: undefined,
      venueMapLink: args.venueMapLink ?? undefined,
      timezone: args.timezone ?? 'Africa/Addis_Ababa',
      slug,
      reservationCount: 0,
      teaserVideoUrl: undefined,
      videoAspectRatio: undefined,
      subtitle: undefined,
      featuredUntil: undefined,
      reservationEnabled: args.actionType === 'reservation',
      reservationLimit: args.reservationLimit ?? undefined,
      likeCount: 0,
      bookmarkCount: 0,
      source: 'organizer',
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

    return eventId
  },
})

export const updateSelf = mutation({
  args: {
    eventId: v.id('events'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    posterUrl: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    venueMapLink: v.optional(v.string()),
    isFree: v.optional(v.boolean()),
    priceDisplay: v.optional(v.string()),
    actionType: v.optional(ORGANIZER_ACTION_TYPE),
    externalLink: v.optional(v.string()),
    externalLinkLabel: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    timezone: v.optional(v.string()),
    reservationLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizer } = await requireOrganizerOwner(ctx)
    const event = await ctx.db.get('events', args.eventId)
    if (!event) throw new Error('Event not found')
    if (event.ownerId !== organizer._id) throw new Error('Not authorized')
    if (event.status === 'published') throw new Error('Published events cannot be edited')
    if (args.externalLink) validateUrl(args.externalLink, 'External link')
    if (args.venueMapLink) validateUrl(args.venueMapLink, 'Venue map link')

    const { eventId, ...fields } = args
    const updates = {
      ...patchDefined(fields),
      ...(fields.actionType !== undefined
        ? { reservationEnabled: fields.actionType === 'reservation' }
        : {}),
    } as Partial<Doc<'events'>>
    await ctx.db.patch('events', eventId, updates)
    return eventId
  },
})
