import type { Metadata } from 'next'
import { DiscoverPageClient } from '@/components/discover/DiscoverPageClient'
import { FeaturedMarquee } from '@/components/home/FeaturedMarquee'
import { FindYourzHeading } from '@/components/home/FindYourzHeading'
import { getPublishedEvents, getFeaturedEvents, getCategories } from '@/lib/api/events'
import { getActiveAnnouncements } from '@/lib/api/announcements'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import type { Event } from '@/types'

export const metadata: Metadata = {
  title: 'Event Nu — Discover Live Experiences in Addis',
  description:
    'Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.',
}

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; date?: string }>
}

/**
 * Merge featured + upcoming events into a single list for the carousel.
 * Featured events come first (they have editorial priority), then upcoming
 * non-featured events fill the rest. Past events are excluded.
 * The final list is capped at `maxItems` and deduplicated by id.
 */
function buildCarouselEvents(featured: Event[], allPublished: Event[], maxItems = 20): Event[] {
  const now = Date.now()
  const featuredIds = new Set(featured.map((e) => e.id))

  // Upcoming published events that are NOT already featured
  const upcoming = allPublished
    .filter((e) => {
      if (featuredIds.has(e.id)) return false
      try {
        return new Date(e.start_date).getTime() >= now
      } catch {
        return false
      }
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

  // Featured first, then upcoming, capped and deduplicated
  const seen = new Set<string>()
  const result: Event[] = []

  for (const event of [...featured, ...upcoming]) {
    if (result.length >= maxItems) break
    if (seen.has(event.id)) continue
    seen.add(event.id)
    result.push(event)
  }

  return result
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const [events, featured, categories, announcements] = await Promise.allSettled([
    getPublishedEvents(),
    getFeaturedEvents(20),
    getCategories(),
    getActiveAnnouncements(),
  ]).then(
    (
      results,
    ): [
      Awaited<ReturnType<typeof getPublishedEvents>>,
      Awaited<ReturnType<typeof getFeaturedEvents>>,
      Awaited<ReturnType<typeof getCategories>>,
      Awaited<ReturnType<typeof getActiveAnnouncements>>,
    ] => results.map((r) => (r.status === 'fulfilled' ? r.value : [])) as never,
  )

  // Rich carousel: featured events + upcoming non-featured events
  const carouselEvents = buildCarouselEvents(featured, events)

  return (
    <>
      <AnnouncementBanner announcements={announcements} />

      {/* Featured events heading — show for any carousel content */}
      {carouselEvents.length > 0 && <FindYourzHeading />}

      {carouselEvents.length > 0 && <FeaturedMarquee events={carouselEvents} />}
      <DiscoverPageClient
        events={events}
        categories={categories}
        initialSearch={typeof params.q === 'string' ? params.q : ''}
        initialCategory={typeof params.category === 'string' ? params.category : undefined}
        initialStatus={typeof params.date === 'string' ? params.date : 'all'}
      />
    </>
  )
}
