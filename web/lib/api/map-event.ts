import type { FunctionReturnType } from 'convex/server'
import { api } from '@eventnu/convex/_generated/api'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import type { Event } from '@/types'

type RawEvent = FunctionReturnType<typeof api.events.read.getPublished>[number]

export function mapEvent(raw: RawEvent): Event {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle,
    description: raw.description,
    poster_url: raw.posterUrl,
    image_aspect_ratio: raw.imageAspectRatio,
    images: (raw.images ?? []).map((img: Doc<'eventImages'>) => ({
      id: img._id,
      url: img.url,
      storage_id: img.storageId,
      filter: img.filter,
      sort_order: img.sortOrder,
    })),
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
    reservation_count: raw.reservationCount,
    timezone: raw.timezone,
    start_date: new Date(raw.startDate).toISOString(),
    end_date: raw.endDate ? new Date(raw.endDate).toISOString() : null,
    created_at: new Date(raw._creationTime).toISOString(),
    event_categories: (raw.categories ?? []).map((cat: Doc<'categories'>) => ({
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
