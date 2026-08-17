interface Profile {
  id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  verified?: boolean
  handle?: string | null
  logo_url?: string | null
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
  insta_permalink?: string | null
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
