import type { PickedImage } from '@/components/media/ImagePicker'

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  icon?: string | null
  sort_order?: number
}

export interface Host {
  id: string
  name: string
  slug: string
}

export interface Organizer {
  profile_id: string
  organizer_name: string
  organizer_handle?: string | null
}

export interface EventFormValues {
  title: string
  slug: string
  description: string
  categoryId: string
  subcategoryIds: string[]
  start_date: string
  end_date: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_map_link: string
  is_free: boolean
  price_display: string
  action_type: string
  external_link: string
  external_link_label: string
  contact_email: string
  reservation_limit: string
  ownershipType: 'host' | 'organizer' | 'standalone'
  host_id: string
  organizer_id: string
  status: string
  frequency_type: string
  is_featured: boolean
  featured_section: string
  admin_note: string
  teaser_video_url: string
  video_aspect_ratio: string
  poster_url: string
  image_aspect_ratio: string
  images: PickedImage[]
}

export type UpdateField = <K extends keyof EventFormValues>(
  field: K,
  value: EventFormValues[K],
) => void

export interface FeaturedSection {
  id: string
  label: string
  slug?: string
}

export const actionTypeOptions = [
  { value: 'open_entry', label: 'Open Entry' },
  { value: 'reservation', label: 'Reservation Required' },
  { value: 'external_link', label: 'External Link' },
  { value: 'contact', label: 'Contact for Info' },
]

export const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'pending_review', label: 'Pending Review' },
]

export const frequencyOptions = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'series', label: 'Series' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'seasonal', label: 'Seasonal' },
]

export const featuredSectionFallback = [
  { value: 'editors_choice', label: "Editor's Choice" },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Popular' },
  { value: 'new_and_noteworthy', label: 'New & Noteworthy' },
]

export const timezoneOptions = [
  { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa (EAT)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
]

export function emptyValues(): EventFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    subcategoryIds: [],
    start_date: '',
    end_date: '',
    timezone: 'Africa/Addis_Ababa',
    venue_name: '',
    venue_address: '',
    venue_map_link: '',
    is_free: false,
    price_display: '',
    action_type: 'open_entry',
    external_link: '',
    external_link_label: '',
    contact_email: '',
    reservation_limit: '',
    ownershipType: 'standalone',
    host_id: '',
    organizer_id: '',
    status: 'draft',
    frequency_type: 'one_time',
    is_featured: false,
    featured_section: 'editors_choice',
    admin_note: '',
    teaser_video_url: '',
    video_aspect_ratio: '',
    poster_url: '',
    image_aspect_ratio: 'original',
    images: [],
  }
}
