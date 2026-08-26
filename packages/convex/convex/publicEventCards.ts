import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { QueryCtx, MutationCtx } from './_generated/server'
import { MAX_EVENT_IMAGES } from './constants'
import { sumLikeShards } from './helpers'

/**
 * Build the denormalized publicEventCard data for a given event from the
 * canonical tables. Used by both single-card rebuild and bulk backfill.
 */
async function buildCardData(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<'events'>,
): Promise<Omit<Doc<'publicEventCards'>, '_id' | '_creationTime'> | null> {
  const event = await ctx.db.get('events', eventId)
  if (!event) return null

  // Collect all image storage IDs and resolve the first (primary) poster URL.
  const images = await ctx.db
    .query('eventImages')
    .withIndex('by_eventId_and_sortOrder', (q) => q.eq('eventId', eventId))
    .order('asc')
    .take(MAX_EVENT_IMAGES)

  let posterUrl = event.posterUrl
  const imageStorageIds: string[] = []
  for (const img of images) {
    if (img.storageId) {
      imageStorageIds.push(img.storageId)
      if (!posterUrl && img.storageId) {
        const resolved = await ctx.storage.getUrl(img.storageId as Id<'_storage'>)
        if (resolved) posterUrl = resolved
      }
    } else if (img.url && !posterUrl) {
      posterUrl = img.url
    }
  }

  // Resolve organizer denormalized fields.
  let organizerName: string | undefined
  let organizerHandle: string | undefined
  let organizerLogoUrl: string | undefined
  let organizerVerified: boolean | undefined
  let organizerFollowerCount: number | undefined
  let organizerProfileId: Id<'profiles'> | undefined

  if (event.ownerId) {
    const org = await ctx.db.get('organizerProfiles', event.ownerId)
    if (org) {
      organizerName = org.organizerName
      organizerHandle = org.organizerHandle
      organizerLogoUrl = org.logoUrl
      organizerVerified = org.verified
      organizerFollowerCount = org.followerCount
      if (org.profileId) organizerProfileId = org.profileId
    }
  }

  return {
    eventId: event._id,
    createdAt: event._creationTime,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    isFeatured: event.isFeatured,
    title: event.title,
    slug: event.slug,
    subtitle: event.subtitle,
    description: event.description,
    posterUrl,
    imageAspectRatio: event.imageAspectRatio,
    teaserVideoUrl: event.teaserVideoUrl,
    videoAspectRatio: event.videoAspectRatio,
    priceDisplay: event.priceDisplay,
    isFree: event.isFree,
    actionType: event.actionType,
    source: event.source,
    frequencyType: event.frequencyType,
    timezone: event.timezone,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    venueMapLink: event.venueMapLink,
    venueLat: event.venueLat,
    venueLng: event.venueLng,
    likeCount: await sumLikeShards(ctx, event._id),
    reservationCount: event.reservationCount,
    reservationEnabled: event.reservationEnabled,
    reservationLimit: event.reservationLimit,
    externalLink: event.externalLink,
    externalLinkLabel: event.externalLinkLabel,
    contactEmail: event.contactEmail,
    imageStorageIds: imageStorageIds.length > 0 ? imageStorageIds : undefined,
    organizerName,
    organizerHandle,
    organizerLogoUrl,
    organizerVerified,
    organizerFollowerCount,
    organizerProfileId,
  }
}

/**
 * Rebuild a single publicEventCard. Idempotent — upserts on eventId.
 * Called from event write/moderation paths to keep the denormalized view fresh.
 */
export const rebuildCard = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const data = await buildCardData(ctx, args.eventId)
    if (!data) return null

    const existing = await ctx.db
      .query('publicEventCards')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, data)
      return existing._id
    }
    return await ctx.db.insert('publicEventCards', data)
  },
})

/**
 * Remove the publicEventCard for a given event.
 */
export const removeCard = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('publicEventCards')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .first()
    if (existing) await ctx.db.delete(existing._id)
  },
})

/**
 * Full backfill — rebuilds every publicEventCard from canonical data.
 * Run this once via a migration or cron. It scans all events and upserts
 * each card. Safe to re-run (idempotent).
 */
export const rebuildAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    let count = 0
    for await (const event of ctx.db.query('events')) {
      const data = await buildCardData(ctx, event._id)
      if (!data) continue

      const existing = await ctx.db
        .query('publicEventCards')
        .withIndex('by_eventId', (q) => q.eq('eventId', event._id))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, data)
      } else {
        await ctx.db.insert('publicEventCards', data)
      }
      count++
    }
    return count
  },
})
