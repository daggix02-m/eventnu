'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Doc, Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReference } from 'convex/server'
import { revalidatePath } from 'next/cache'
import { mapEvent, mapEventCategory } from '../mappers'
import { toDateTimeLocal } from '@/lib/format'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export async function getEvents(params: {
  status?: string
  source?: string
  featured?: boolean
  frequency?: string
  search?: string
  cursor?: string | null
}) {
  const result = await fetchQuery(api.events.read.list, {
    paginationOpts: { numItems: DEFAULT_PAGE_SIZE, cursor: params.cursor ?? null },
    status: params.status !== 'all' ? params.status : undefined,
    source: params.source !== 'all' ? params.source : undefined,
    featured: params.featured,
    frequency: params.frequency !== 'all' ? params.frequency : undefined,
    search: params.search,
  })
  return {
    items: (result.page ?? []).map(mapEvent),
    nextCursor: (result.continueCursor ?? null) as string | null,
    isDone: result.isDone,
  }
}

export async function updateEventStatus(eventId: string, status: string, note?: string) {
  await fetchMutation(api.events.moderation.updateStatus, {
    eventId: eventId as Id<'events'>,
    status,
    note,
  })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function bulkUpdateEventStatus(eventIds: string[], status: string) {
  await fetchMutation(api.events.moderation.bulkUpdateStatus, {
    eventIds: eventIds as Id<'events'>[],
    status,
  })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function featureEvent(eventId: string, section: string, until: string | null) {
  await fetchMutation(api.events.moderation.feature, {
    eventId: eventId as Id<'events'>,
    section,
    until: until ? new Date(until).getTime() : undefined,
  })
  revalidatePath('/events')
}

export async function unfeatureEvent(eventId: string) {
  await fetchMutation(api.events.moderation.unfeature, { eventId: eventId as Id<'events'> })
  revalidatePath('/events')
}

export async function deleteEvent(eventId: string) {
  await fetchMutation(api.events.write.deleteEvent, { eventId: eventId as Id<'events'> })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function getEventById(eventId: string) {
  const result = await fetchQuery(api.events.read.getById, { eventId: eventId as Id<'events'> })
  return {
    event: result.event ? mapEvent(result.event) : null,
    categories: (result.categories ?? []).map((c, i) => mapEventCategory(c, i)),
    images: (result.images ?? []).map((img) => ({
      url: img.url,
      storageId: img.storageId ?? null,
      filter: img.filter ?? '',
    })),
  }
}

async function getRecentEvents(
  queryRef: FunctionReference<'query', 'public'>,
  idKey: 'hostId' | 'profileId',
  id: string,
  limit = 20,
) {
  const events = await fetchQuery(queryRef, { [idKey]: id as Id<'hosts'>, limit })
  return (events ?? []).map(
    (e: {
      _id: string
      title?: string | null
      startDate?: number | null
      status?: string | null
    }) => ({
      id: e._id,
      title: e.title ?? '',
      start_date: toDateTimeLocal(e.startDate),
      status: e.status ?? 'draft',
    }),
  )
}

export async function getHostRecentEvents(hostId: string) {
  return getRecentEvents(api.events.read.listByHost, 'hostId', hostId)
}

export async function getOrganizerRecentEvents(profileId: string) {
  return getRecentEvents(api.events.read.listByOrganizer, 'profileId', profileId)
}

export async function getUploadUrl() {
  return await fetchMutation(api.events.write.generateUploadUrl)
}

export async function resolveStorageUrls(storageIds: string[]) {
  return await fetchQuery(api.events.read.getStorageUrls, {
    storageIds: storageIds.filter(Boolean),
  })
}

export async function createEvent(data: {
  title: string
  description?: string
  start_date: string
  end_date?: string | null
  poster_url?: string | null
  image_aspect_ratio?: string | null
  images?: { url: string; storageId?: string | null; filter?: string | null }[]
  venue_name?: string
  venue_address?: string
  is_free?: boolean
  price_display?: string | null
  action_type?: string
  external_link?: string | null
  external_link_label?: string | null
  contact_email?: string | null
  reservation_limit?: number | null
  status?: string
  host_id?: string | null
  organizer_id?: string | null
  is_standalone?: boolean
  frequency_type?: string
  teaser_video_url?: string | null
  video_aspect_ratio?: string | null
  is_featured?: boolean
  featured_section?: string | null
  admin_note?: string | null
  venue_map_link?: string | null
  timezone?: string
  source?: string
  slug?: string | null
  categoryIds?: string[]
}) {
  const result = await fetchMutation(api.events.write.create, {
    title: data.title,
    description: data.description ?? undefined,
    startDate: data.start_date ? new Date(data.start_date).getTime() : Date.now(),
    endDate: data.end_date ? new Date(data.end_date).getTime() : undefined,
    posterUrl: data.poster_url ?? undefined,
    imageAspectRatio: data.image_aspect_ratio ?? undefined,
    images:
      data.images?.map((img) => ({
        url: img.url,
        storageId: img.storageId ?? undefined,
        filter: img.filter ?? undefined,
      })) ?? undefined,
    venueName: data.venue_name ?? '',
    venueAddress: data.venue_address ?? undefined,
    isFree: data.is_free ?? false,
    priceDisplay: data.price_display ?? undefined,
    actionType: data.action_type as Doc<'events'>['actionType'] ?? 'open_entry',
    externalLink: data.external_link ?? undefined,
    externalLinkLabel: data.external_link_label ?? undefined,
    contactEmail: data.contact_email ?? undefined,
    status: data.status as Doc<'events'>['status'] ?? 'draft',
    hostId: (data.host_id as Id<'hosts'>) ?? undefined,
    organizerId: (data.organizer_id as Id<'profiles'>) ?? undefined,
    isStandalone: data.is_standalone ?? false,
    frequencyType: data.frequency_type ?? 'one_time',
    isFeatured: data.is_featured ?? false,
    featuredSection: data.featured_section ?? undefined,
    adminNote: data.admin_note ?? undefined,
    venueMapLink: data.venue_map_link ?? undefined,
    timezone: data.timezone ?? 'Africa/Addis_Ababa',
    slug: data.slug ?? undefined,
    categoryIds: (data.categoryIds as Id<'categories'>[]) ?? undefined,
    reservationLimit: data.reservation_limit ?? undefined,
    teaserVideoUrl: data.teaser_video_url ?? undefined,
    videoAspectRatio: data.video_aspect_ratio ?? undefined,
  })
  revalidatePath('/events')
  revalidatePath('/')
  return result
}

export async function updateEvent(
  eventId: string,
  data: {
    title?: string
    description?: string
    start_date?: string
    end_date?: string | null
    poster_url?: string | null
    image_aspect_ratio?: string | null
    images?: { url: string; storageId?: string | null; filter?: string | null }[]
    venue_name?: string
    venue_address?: string
    is_free?: boolean
    price_display?: string | null
    action_type?: string
    external_link?: string | null
    external_link_label?: string | null
    contact_email?: string | null
    reservation_limit?: number | null
    status?: string
    host_id?: string | null
    organizer_id?: string | null
    is_standalone?: boolean
    frequency_type?: string
    teaser_video_url?: string | null
    video_aspect_ratio?: string | null
    is_featured?: boolean
    featured_section?: string | null
    featured_until?: string | null
    admin_note?: string | null
    venue_map_link?: string | null
    timezone?: string
    source?: string
    slug?: string | null
    categoryIds?: string[]
  },
) {
  await fetchMutation(api.events.write.update, {
    eventId: eventId as Id<'events'>,
    title: data.title ?? undefined,
    description: data.description ?? undefined,
    startDate: data.start_date ? new Date(data.start_date).getTime() : undefined,
    endDate: data.end_date ? new Date(data.end_date).getTime() : undefined,
    posterUrl: data.poster_url ?? undefined,
    imageAspectRatio: data.image_aspect_ratio ?? undefined,
    images:
      data.images?.map((img) => ({
        url: img.url,
        storageId: img.storageId ?? undefined,
        filter: img.filter ?? undefined,
      })) ?? undefined,
    venueName: data.venue_name ?? '',
    venueAddress: data.venue_address ?? undefined,
    isFree: data.is_free ?? false,
    priceDisplay: data.price_display ?? undefined,
    actionType: data.action_type as Doc<'events'>['actionType'] ?? undefined,
    externalLink: data.external_link ?? undefined,
    externalLinkLabel: data.external_link_label ?? undefined,
    contactEmail: data.contact_email ?? undefined,
    status: data.status as Doc<'events'>['status'] ?? undefined,
    hostId: (data.host_id as Id<'hosts'>) ?? undefined,
    organizerId: (data.organizer_id as Id<'profiles'>) ?? undefined,
    isStandalone: data.is_standalone ?? false,
    frequencyType: data.frequency_type ?? 'one_time',
    isFeatured: data.is_featured ?? false,
    featuredSection: data.featured_section ?? undefined,
    featuredUntil: data.featured_until ? new Date(data.featured_until).getTime() : undefined,
    adminNote: data.admin_note ?? undefined,
    venueMapLink: data.venue_map_link ?? undefined,
    timezone: data.timezone ?? 'Africa/Addis_Ababa',
    slug: data.slug ?? undefined,
    categoryIds: (data.categoryIds as Id<'categories'>[]) ?? undefined,
    reservationLimit: data.reservation_limit ?? undefined,
    teaserVideoUrl: data.teaser_video_url ?? undefined,
    videoAspectRatio: data.video_aspect_ratio ?? undefined,
  })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/')
}
