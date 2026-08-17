import { fetchQuery } from 'convex/nextjs'
import type { FunctionReturnType } from 'convex/server'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import type { Event, Category, Page } from '@/types'

type RawEvent = FunctionReturnType<typeof api.events.read.getPublished>[number]
type RawCategory = FunctionReturnType<typeof api.categories.getRoot>[number]
type RawCategoryWithCount = FunctionReturnType<typeof api.categories.getWithEventCounts>[number]
type RawPage = FunctionReturnType<typeof api.cms.pages.getPublishedPages>[number]

export function mapEvent(raw: RawEvent): Event {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle,
    description: raw.description,
    poster_url: raw.posterUrl,
    image_aspect_ratio: raw.imageAspectRatio,
    images: (raw.images ?? []).map((img) => ({
      id: img._id,
      url: img.url,
      storage_id: img.storageId,
      filter: img.filter,
      sort_order: img.sortOrder,
    })),
    insta_permalink: raw.instaPermalink,
    teaser_video_url: raw.teaserVideoUrl,
    video_aspect_ratio: raw.videoAspectRatio,
    external_link: raw.externalLink,
    external_link_label: raw.externalLinkLabel,
    price_display: raw.priceDisplay,
    is_free: raw.isFree,
    action_type: raw.actionType,
    status: raw.status,
    source: raw.source,
    is_featured: raw.isFeatured,
    organizer_id: raw.ownerId,
    venue_name: raw.venueName,
    venue_address: raw.venueAddress,
    venue_map_link: raw.venueMapLink,
    venue_lat: raw.venueLat,
    venue_lng: raw.venueLng,
    like_count: raw.likeCount,
    reservation_enabled: raw.reservationEnabled,
    reservation_limit: raw.reservationLimit,
    timezone: raw.timezone,
    start_date: new Date(raw.startDate).toISOString(),
    end_date: raw.endDate ? new Date(raw.endDate).toISOString() : null,
    created_at: new Date(raw._creationTime).toISOString(),
    event_categories: (raw.categories ?? []).map((cat) => ({
      category_id: cat._id,
      event_id: raw._id,
      is_primary: raw.primaryCategoryId === cat._id,
      categories: {
        id: cat._id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        parent_id: cat.parentId,
        sort_order: cat.sortOrder,
      },
    })),
    organizer: raw.organizer
      ? {
          id: raw.organizer._id,
          full_name: raw.organizer.fullName ?? null,
          avatar_url: raw.organizer.avatarUrl ?? null,
          verified: raw.organizer.verified,
          handle: raw.organizer.handle ?? null,
          logo_url: raw.organizer.logoUrl ?? null,
          bio: raw.organizer.bio ?? null,
          follower_count: raw.organizer.followerCount,
          created_at: raw.organizer._creationTime
            ? new Date(raw.organizer._creationTime).toISOString()
            : undefined,
        }
      : null,
  }
}

export async function getPublishedEvents(): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.read.getPublished)
    return (events ?? []).map(mapEvent)
  } catch (err) {
    console.error('Failed to fetch published events:', err)
    return []
  }
}

export async function getFeaturedEvents(limit = 5): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.read.getFeatured, {
      startDate: Date.now(),
      limit,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    console.error('Failed to fetch featured events:', err)
    return []
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const event = await fetchQuery(api.events.read.getBySlug, { slug })
    return event ? mapEvent(event) : null
  } catch (err) {
    console.error('Failed to fetch event by slug:', err)
    return null
  }
}

export async function getSimilarEvents(event: Event, limit = 3): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.read.getSimilar, {
      eventId: event.id as Id<'events'>,
      limit,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    console.error('Failed to fetch similar events:', err)
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await fetchQuery(api.categories.getRoot)
    return (categories ?? []).map((raw: RawCategory) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
    }))
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    return []
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await fetchQuery(api.categories.getBySlug, { slug })
    if (!category) return null
    return {
      id: category._id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      parent_id: category.parentId,
      sort_order: category.sortOrder,
    }
  } catch (err) {
    console.error('Failed to fetch category by slug:', err)
    return null
  }
}

export interface CategoryWithCount extends Category {
  eventCount: number
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const categories = await fetchQuery(api.categories.getWithEventCounts)
    return (categories ?? []).map((raw: RawCategoryWithCount) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
      eventCount: raw.eventCount ?? 0,
    }))
  } catch (err) {
    console.error('Failed to fetch categories with counts:', err)
    return []
  }
}

export async function getEventsByCategory(categoryId: string): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.read.getByCategory, {
      categoryId: categoryId as Id<'categories'>,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    console.error('Failed to fetch events by category:', err)
    return []
  }
}

export async function getPublishedPages(): Promise<Page[]> {
  try {
    const pages = await fetchQuery(api.cms.pages.getPublishedPages)
    return (pages ?? []).map((raw: RawPage) => ({
      id: raw._id,
      slug: raw.slug,
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body,
      body_html: raw.bodyHtml,
      hero_image_url: raw.heroImageUrl,
      is_published: raw.isPublished,
      sort_order: raw.sortOrder,
      created_at: raw._creationTime ? new Date(raw._creationTime).toISOString() : undefined,
    }))
  } catch (err) {
    console.error('Failed to fetch published pages:', err)
    return []
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const raw = await fetchQuery(api.cms.pages.getPageBySlug, { slug })
    if (!raw) return null
    return {
      id: raw._id,
      slug: raw.slug,
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body,
      body_html: raw.bodyHtml,
      hero_image_url: raw.heroImageUrl,
      is_published: raw.isPublished,
      sort_order: raw.sortOrder,
      created_at: raw._creationTime ? new Date(raw._creationTime).toISOString() : undefined,
    }
  } catch (err) {
    console.error('Failed to fetch page by slug:', err)
    return null
  }
}
