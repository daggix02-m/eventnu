import type { Event, DiscoverEvent } from '@/types'

/**
 * Reduce a full `Event` to the fields the discover/card/schedule trees render.
 * The home page ships up to 100 events to the client for filtering; trimming
 * the per-event object keeps the RSC payload small without changing behavior.
 */
export function toDiscoverEvent(event: Event): DiscoverEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    subtitle: event.subtitle,
    description: event.description,
    poster_url: event.poster_url,
    images: event.images,
    start_date: event.start_date,
    end_date: event.end_date,
    timezone: event.timezone,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    price_display: event.price_display,
    is_free: event.is_free,
    like_count: event.like_count,
    organizer: event.organizer
      ? {
          id: event.organizer.id,
          full_name: event.organizer.full_name,
          handle: event.organizer.handle,
          logo_url: event.organizer.logo_url,
          verified: event.organizer.verified,
        }
      : null,
    event_categories: event.event_categories?.map((ec) => ({
      is_primary: ec.is_primary,
      categories: ec.categories,
    })),
  }
}
