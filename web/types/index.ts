interface Profile {
  id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  verified?: boolean
  handle?: string | null
  logo_url?: string | null
  bio?: string | null
  follower_count?: number
  created_at?: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description?: string | null
  icon?: string | null
  parent_id?: string | null
  sort_order?: number
}

interface EventCategory {
  category_id: string
  event_id: string
  is_primary: boolean
  categories?: Category
}

export interface EventImage {
  id: string
  url: string
  storage_id?: string | null
  filter?: string | null
  sort_order?: number
}

export interface Event {
  id: string
  title: string
  subtitle?: string | null
  description: string
  start_date: string
  end_date?: string | null
  poster_url?: string | null
  image_aspect_ratio?: string | null
  images?: EventImage[]
  teaser_video_url?: string | null
  external_link?: string | null
  external_link_label?: string | null
  price_display?: string | null
  is_free: boolean
  action_type?: string | null
  status: string
  organizer_id: string | undefined
  venue_name: string
  venue_address?: string | null
  venue_map_link?: string | null
  venue_lat?: number | null
  venue_lng?: number | null
  like_count?: number
  reminder_sent?: boolean
  reservation_enabled?: boolean
  reservation_limit?: number | null
  reservation_count?: number
  timezone?: string
  video_aspect_ratio?: string | null
  created_at?: string
  updated_at?: string
  // Admin publishing additions
  source?: string
  is_featured?: boolean
  slug?: string | null
  // Joined data
  event_categories?: EventCategory[]
  organizer?: Profile | null
}

/**
 * Slimmed event shape sent to the home/discover client tree. The full `Event`
 * carries fields the cards never render (venue map links, reservation state,
 * video URLs, audit timestamps…); serializing all of them for ~100 events
 * bloats the RSC payload for every anonymous visitor. Components that render
 * event cards accept `DiscoverEvent`, and full `Event`s remain assignable to
 * it, so this only shrinks the home payload without touching other routes.
 */
export interface DiscoverImage {
  id: string
  url: string
  filter?: string | null
}

export interface DiscoverOrganizer {
  id: string
  full_name?: string | null
  handle?: string | null
  logo_url?: string | null
  verified?: boolean
}

export interface DiscoverCategory {
  id: string
  slug: string
  name: string
}

export interface DiscoverEventCategory {
  is_primary: boolean
  categories?: DiscoverCategory
}

export interface DiscoverEvent {
  id: string
  title: string
  slug?: string | null
  subtitle?: string | null
  description: string
  poster_url?: string | null
  images?: DiscoverImage[]
  start_date: string
  end_date?: string | null
  timezone?: string
  venue_name: string
  venue_address?: string | null
  price_display?: string | null
  is_free: boolean
  like_count?: number
  organizer?: DiscoverOrganizer | null
  event_categories?: DiscoverEventCategory[]
}

export interface Page {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  body: Record<string, unknown>
  body_html?: string | null
  hero_image_url?: string | null
  is_published: boolean
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface Announcement {
  id: string
  title: string
  message?: string | null
  link_url?: string | null
  link_text?: string | null
  is_active: boolean
  starts_at?: string | null
  ends_at?: string | null
  created_at?: string
}
