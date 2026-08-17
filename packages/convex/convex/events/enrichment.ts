import { v } from 'convex/values'
import { QueryCtx, MutationCtx } from '../_generated/server'
import { Doc, Id } from '../_generated/dataModel'
import { MAX_EVENT_IMAGES } from '../constants'

export const eventImageValidator = v.object({
  url: v.string(),
  storageId: v.optional(v.string()),
  filter: v.optional(v.string()),
})

export async function getEventImages(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  return await ctx.db
    .query('eventImages')
    .withIndex('by_eventId_and_sortOrder', (q) => q.eq('eventId', eventId))
    .take(MAX_EVENT_IMAGES)
}

export async function resolveImageUrls(
  ctx: QueryCtx | MutationCtx,
  images: Array<Doc<'eventImages'>>,
) {
  return Promise.all(
    images.map(async (img) => {
      if (!img.url && img.storageId) {
        const url = await ctx.storage.getUrl(img.storageId as Id<'_storage'>)
        if (url) return { ...img, url }
      }
      return img
    }),
  )
}

export async function getEventCategoryLinks(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  const rows = await ctx.db
    .query('eventCategories')
    .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', eventId))
    .take(20)
  return rows.sort((a, b) =>
    a.isPrimary === b.isPrimary ? a._creationTime - b._creationTime : a.isPrimary ? -1 : 1,
  )
}

export type PublicOrganizer = {
  _id: Id<'organizerProfiles'>
  fullName?: string
  avatarUrl?: string
  verified: boolean
  handle?: string
  logoUrl?: string
  bio?: string
  followerCount: number
  _creationTime: number
}

export function toPublicOrganizer(
  organizer: Doc<'organizerProfiles'> | null,
  profile?: Doc<'profiles'> | null,
): PublicOrganizer | null {
  if (!organizer) return null
  return {
    _id: organizer._id,
    fullName: organizer.organizerName,
    avatarUrl: profile?.avatarUrl,
    verified: organizer.verified,
    handle: organizer.organizerHandle,
    logoUrl: organizer.logoUrl,
    bio: organizer.bio,
    followerCount: organizer.followerCount,
    _creationTime: organizer._creationTime,
  }
}

export type PublicEvent = {
  _id: Id<'events'>
  _creationTime: number
  title: string
  slug?: string
  description: string
  subtitle?: string
  startDate: number
  endDate?: number
  posterUrl?: string
  imageAspectRatio?: string
  instaPermalink?: string
  teaserVideoUrl?: string
  videoAspectRatio?: string
  externalLink?: string
  externalLinkLabel?: string
  priceDisplay?: string
  isFree: boolean
  actionType: Doc<'events'>['actionType']
  status: Doc<'events'>['status']
  source: string
  ownerId?: Id<'organizerProfiles'>
  isFeatured: boolean
  venueName: string
  venueAddress?: string
  venueMapLink?: string
  venueLat?: number
  venueLng?: number
  likeCount: number
  reservationEnabled: boolean
  reservationLimit?: number
  timezone: string
  categories: Array<Doc<'categories'>>
  images: Array<Doc<'eventImages'>>
  organizer: PublicOrganizer | null
  primaryCategoryId?: Id<'categories'>
}

export function toPublicEvent(
  event: Doc<'events'>,
  categories: Array<Doc<'categories'>>,
  images: Array<Doc<'eventImages'>>,
  organizer: PublicOrganizer | null,
): PublicEvent {
  return {
    _id: event._id,
    _creationTime: event._creationTime,
    title: event.title,
    slug: event.slug,
    description: event.description,
    subtitle: event.subtitle,
    startDate: event.startDate,
    endDate: event.endDate,
    posterUrl: images[0]?.url ?? event.posterUrl,
    imageAspectRatio: event.imageAspectRatio,
    instaPermalink: event.instaPermalink,
    teaserVideoUrl: event.teaserVideoUrl,
    videoAspectRatio: event.videoAspectRatio,
    externalLink: event.externalLink,
    externalLinkLabel: event.externalLinkLabel,
    priceDisplay: event.priceDisplay,
    isFree: event.isFree,
    actionType: event.actionType,
    status: event.status,
    source: event.source,
    ownerId: event.ownerId,
    isFeatured: event.isFeatured,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    venueMapLink: event.venueMapLink,
    venueLat: event.venueLat,
    venueLng: event.venueLng,
    likeCount: event.likeCount,
    reservationEnabled: event.reservationEnabled,
    reservationLimit: event.reservationLimit,
    timezone: event.timezone,
    categories,
    images,
    organizer,
    primaryCategoryId: categories[0]?._id,
  }
}

export async function enrichPublicEvent(
  ctx: QueryCtx,
  event: Doc<'events'>,
  includeOrganizer = false,
): Promise<PublicEvent> {
  const links = await getEventCategoryLinks(ctx, event._id)
  const categories = (
    await Promise.all(links.map((link) => ctx.db.get('categories', link.categoryId)))
  ).filter((c): c is Doc<'categories'> => c !== null)
  const images = await resolveImageUrls(ctx, await getEventImages(ctx, event._id))
  const ownerId = event.ownerId
  let organizer: PublicOrganizer | null = null
  if (includeOrganizer && ownerId) {
    const org = await ctx.db.get('organizerProfiles', ownerId)
    const profile = org?.profileId ? await ctx.db.get('profiles', org.profileId) : null
    organizer = toPublicOrganizer(org, profile)
  }
  return toPublicEvent(event, categories, images, organizer)
}

export async function enrichPublicEvents(
  ctx: QueryCtx,
  events: Array<Doc<'events'>>,
): Promise<Array<PublicEvent>> {
  if (events.length === 0) return []

  const linksByEvent = await Promise.all(
    events.map((event) => getEventCategoryLinks(ctx, event._id)),
  )

  const categoryIds = new Set<Id<'categories'>>()
  for (const links of linksByEvent) {
    for (const link of links) categoryIds.add(link.categoryId)
  }
  const categoryDocs = await Promise.all([...categoryIds].map((id) => ctx.db.get('categories', id)))
  const categoryById = new Map<Id<'categories'>, Doc<'categories'>>()
  for (const doc of categoryDocs) {
    if (doc) categoryById.set(doc._id, doc)
  }

  const imagesByEvent = await Promise.all(
    events.map(async (event) => resolveImageUrls(ctx, await getEventImages(ctx, event._id))),
  )

  const ownerIds = [
    ...new Set(
      events.map((e) => e.ownerId).filter((id): id is Id<'organizerProfiles'> => id !== undefined),
    ),
  ]
  const orgs = await Promise.all(ownerIds.map((id) => ctx.db.get('organizerProfiles', id)))
  const orgById = new Map<Id<'organizerProfiles'>, Doc<'organizerProfiles'>>()
  ownerIds.forEach((id, i) => {
    if (orgs[i]) orgById.set(id, orgs[i] as Doc<'organizerProfiles'>)
  })

  const profileIds = [
    ...new Set(
      orgs
        .filter((o): o is Doc<'organizerProfiles'> => o !== null && o.profileId !== undefined)
        .map((o) => o.profileId as Id<'profiles'>),
    ),
  ]
  const profiles = await Promise.all(profileIds.map((id) => ctx.db.get('profiles', id)))
  const profileById = new Map<Id<'profiles'>, Doc<'profiles'>>()
  profileIds.forEach((id, i) => {
    if (profiles[i]) profileById.set(id, profiles[i] as Doc<'profiles'>)
  })

  return events.map((event, i) => {
    const categories = linksByEvent[i]
      .map((link) => categoryById.get(link.categoryId))
      .filter((c): c is Doc<'categories'> => c !== undefined)
    const org = event.ownerId ? (orgById.get(event.ownerId) ?? null) : null
    const profile = org?.profileId ? (profileById.get(org.profileId) ?? null) : null
    return toPublicEvent(event, categories, imagesByEvent[i], toPublicOrganizer(org, profile))
  })
}
