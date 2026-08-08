'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapEvent, mapEventCategory, toDateTimeLocal } from '../mappers'

export async function getEvents(params: {
  status?: string
  source?: string
  featured?: boolean
  frequency?: string
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const result = await fetchQuery(api.events.list, {
      paginationOpts: { numItems: params.perPage ?? 20, cursor: null },
      status: params.status !== 'all' ? params.status : undefined,
      source: params.source !== 'all' ? params.source : undefined,
      featured: params.featured,
      frequency: params.frequency !== 'all' ? params.frequency : undefined,
      search: params.search,
      page: params.page ?? 1,
    })
    return { events: (result.page ?? []).map(mapEvent), count: (result as any).totalCount ?? 0 }
  } catch (err) {
    console.error('Failed to load events:', err)
    throw err
  }
}

export async function updateEventStatus(
  eventId: string,
  status: string,
  note?: string
) {
  await fetchMutation(api.events.updateStatus, {
    eventId: eventId as any,
    status,
    note,
  })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function bulkUpdateEventStatus(
  eventIds: string[],
  status: string
) {
  await fetchMutation(api.events.bulkUpdateStatus, {
    eventIds: eventIds as any,
    status,
  })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function featureEvent(
  eventId: string,
  section: string,
  until: string | null
) {
  await fetchMutation(api.events.feature, {
    eventId: eventId as any,
    section,
    until: until ? new Date(until).getTime() : undefined,
  })
  revalidatePath('/events')
}

export async function unfeatureEvent(eventId: string) {
  await fetchMutation(api.events.unfeature, { eventId: eventId as any })
  revalidatePath('/events')
}

export async function deleteEvent(eventId: string) {
  await fetchMutation(api.events.deleteEvent, { eventId: eventId as any })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function getEventById(eventId: string) {
  try {
    const result = await fetchQuery(api.events.getById, { eventId: eventId as any })
    return {
      event: result.event ? mapEvent(result.event) : null,
      categories: (result.categories ?? []).map((c: any, i: number) => mapEventCategory(c, i)),
      images: (result.images ?? []).map((img: any) => ({
        url: img.url,
        storageId: img.storageId ?? null,
        filter: img.filter ?? null,
      })),
    }
  } catch (err) {
    console.error('Failed to load event details:', err)
    throw err
  }
}

async function getRecentEvents(
  queryRef: any,
  idKey: string,
  id: string,
  limit = 20
) {
  const events = await fetchQuery(queryRef, { [idKey]: id as any, limit })
  return (events ?? []).map((e: any) => ({
    id: e._id,
    title: e.title ?? '',
    start_date: toDateTimeLocal(e.startDate),
    status: e.status ?? 'draft',
  }))
}

export async function getHostRecentEvents(hostId: string) {
  return getRecentEvents(api.events.listByHost, 'hostId', hostId)
}

export async function getOrganizerRecentEvents(profileId: string) {
  return getRecentEvents(api.events.listByOrganizer, 'profileId', profileId)
}

export async function getUserRecentEvents(profileId: string) {
  return getRecentEvents(api.events.listByOrganizer, 'profileId', profileId)
}

export async function getUploadUrl() {
  return await fetchMutation(api.events.generateUploadUrl)
}

export async function resolveStorageUrls(storageIds: string[]) {
  return await fetchQuery(api.events.getStorageUrls, {
    storageIds: storageIds.filter(Boolean),
  })
}

export async function createEvent(
  data: {
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
  }
) {
  const result = await fetchMutation(api.events.create, {
    title: data.title,
    description: data.description,
    startDate: new Date(data.start_date).getTime(),
    endDate: data.end_date ? new Date(data.end_date).getTime() : undefined,
    posterUrl: data.poster_url ?? undefined,
    imageAspectRatio: data.image_aspect_ratio ?? undefined,
    images: data.images?.map((img) => ({
      url: img.url,
      storageId: img.storageId ?? undefined,
      filter: img.filter ?? undefined,
    })) ?? undefined,
    venueName: data.venue_name,
    venueAddress: data.venue_address,
    isFree: data.is_free,
    priceDisplay: data.price_display ?? undefined,
    actionType: data.action_type,
    externalLink: data.external_link ?? undefined,
    externalLinkLabel: data.external_link_label ?? undefined,
    contactEmail: data.contact_email ?? undefined,
    status: data.status,
    hostId: data.host_id as any ?? undefined,
    organizerId: data.organizer_id as any ?? undefined,
    isStandalone: data.is_standalone,
    frequencyType: data.frequency_type,
    isFeatured: data.is_featured,
    featuredSection: data.featured_section ?? undefined,
    adminNote: data.admin_note ?? undefined,
    venueMapLink: data.venue_map_link ?? undefined,
    timezone: data.timezone,
    slug: data.slug ?? undefined,
    categoryIds: data.categoryIds as any ?? undefined,
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
  }
) {
  await fetchMutation(api.events.update, {
    eventId: eventId as any,
    title: data.title,
    description: data.description,
    startDate: data.start_date ? new Date(data.start_date).getTime() : undefined,
    endDate: data.end_date ? new Date(data.end_date).getTime() : undefined,
    posterUrl: data.poster_url ?? undefined,
    imageAspectRatio: data.image_aspect_ratio ?? undefined,
    images: data.images?.map((img) => ({
      url: img.url,
      storageId: img.storageId ?? undefined,
      filter: img.filter ?? undefined,
    })) ?? undefined,
    venueName: data.venue_name,
    venueAddress: data.venue_address,
    isFree: data.is_free,
    priceDisplay: data.price_display ?? undefined,
    actionType: data.action_type,
    externalLink: data.external_link ?? undefined,
    externalLinkLabel: data.external_link_label ?? undefined,
    contactEmail: data.contact_email ?? undefined,
    status: data.status,
    hostId: data.host_id as any ?? undefined,
    organizerId: data.organizer_id as any ?? undefined,
    isStandalone: data.is_standalone,
    frequencyType: data.frequency_type,
    isFeatured: data.is_featured,
    featuredSection: data.featured_section ?? undefined,
    featuredUntil: data.featured_until ? new Date(data.featured_until).getTime() : undefined,
    adminNote: data.admin_note ?? undefined,
    venueMapLink: data.venue_map_link ?? undefined,
    timezone: data.timezone,
    slug: data.slug ?? undefined,
    categoryIds: data.categoryIds as any ?? undefined,
    reservationLimit: data.reservation_limit ?? undefined,
    teaserVideoUrl: data.teaser_video_url ?? undefined,
    videoAspectRatio: data.video_aspect_ratio ?? undefined,
  })
  revalidatePath('/events')
  revalidatePath(`/events/${eventId}`)
  revalidatePath('/')
}
