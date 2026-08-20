import type { Metadata } from 'next'
import { getActiveAnnouncements } from '@/lib/api/announcements'
import { getPublishedEvents, getCategories } from '@/lib/api/events'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import type { OrganizerStat } from '@/components/organizers/StatBand'
import { OrganizersClient } from './OrganizersClient'

export const metadata: Metadata = {
  title: 'For Organizers | Event Nu — Launch Your Event in Addis',
  description:
    'List your event in Addis Ababa for free. Reach people planning their next night out, accept Telebirr and CBE Birr, and grow your audience.',
}

export default async function OrganizersPage() {
  const [announcements, events, categories] = await Promise.all([
    getActiveAnnouncements(),
    getPublishedEvents(),
    getCategories(),
  ])

  const venueCount = new Set(events.map((e) => e.venue_name).filter(Boolean)).size

  const stats: OrganizerStat[] = [
    {
      value: events.length,
      label: 'Live events listed',
      description: 'Published events on Event Nu right now.',
      icon: 'calendar',
    },
    {
      value: categories.length,
      label: 'Categories',
      description: 'Ways to explore the city — nightlife, music, food, and culture.',
      icon: 'palette',
    },
    {
      value: venueCount,
      label: 'Venues covered',
      description: 'Real venues and locations across Addis Ababa.',
      icon: 'map-pin',
    },
    {
      value: 0,
      suffix: ' ETB',
      label: 'Free to list',
      description: 'No platform fee to publish an event.',
      icon: 'banknote',
    },
  ]

  return (
    <>
      <AnnouncementBanner announcements={announcements} />
      <OrganizersClient
        contactUrl="/contact"
        events={events}
        categoryCount={categories.length}
        stats={stats}
      />
    </>
  )
}
