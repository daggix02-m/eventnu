import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DiscoverPageClient } from '@/components/discover/DiscoverPageClient'
import { FeaturedMarquee } from '@/components/home/FeaturedMarquee'
import { FindYourzHeading } from '@/components/home/FindYourzHeading'
import { StoriesRail } from '@/components/stories/StoriesRail'
import { getPublishedEvents, getFeaturedEvents, getCategories } from '@/lib/api/events'
import { getActiveAnnouncements } from '@/lib/api/announcements'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import { toDiscoverEvent } from '@/lib/discover'
import type { Event } from '@/types'

export const revalidate = 300
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Event Nu — Discover Live Experiences in Addis',
  description:
    'Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.',
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

// Each data-fetching section is its own async server component wrapped in a
// <Suspense> boundary, so the shell streams before the slowest Convex query
// resolves. The `cache()`-wrapped helpers dedupe the overlapping fetches
// (featured + discover both read getPublishedEvents) within one render pass.

async function AnnouncementsSection() {
  const announcements = await getActiveAnnouncements()
  return <AnnouncementBanner announcements={announcements} />
}

async function FeaturedSection() {
  const [events, featured] = await Promise.all([getPublishedEvents(), getFeaturedEvents(20)])
  const carouselEvents = buildCarouselEvents(featured, events)
  if (carouselEvents.length === 0) return null
  return (
    <>
      <FindYourzHeading />
      <FeaturedMarquee events={carouselEvents} />
    </>
  )
}

function FeaturedSkeleton() {
  return (
    <div className="py-lg" aria-hidden="true">
      <div className="mx-auto w-full max-w-container-max px-4 md:px-gutter space-y-md">
        <div className="h-8 w-64 bg-surface-container-high rounded animate-pulse" />
        <div className="flex gap-md overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-64 h-36 bg-surface-container-high rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

async function DiscoverSection() {
  const [events, categories] = await Promise.all([getPublishedEvents(), getCategories()])
  const discoverEvents = events.map(toDiscoverEvent)
  // DiscoverPageClient reads ?q=, ?category= and ?date= itself via
  // useSearchParams (filtering is fully client-side), so the home route
  // needs no searchParams to stay ISR-cacheable. The Suspense boundary
  // keeps that read from opting the whole route into dynamic rendering.
  return <DiscoverPageClient events={discoverEvents} categories={categories} />
}

function DiscoverSkeleton() {
  return (
    <div className="py-lg" aria-hidden="true">
      <div className="mx-auto w-full max-w-container-max px-4 md:px-gutter grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-surface-container-high" />
            <div className="p-md space-y-sm">
              <div className="h-5 w-3/4 bg-surface-container-high rounded" />
              <div className="h-4 w-1/2 bg-surface-container-high rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AnnouncementsSection />
      </Suspense>

      <Suspense fallback={null}>
        <StoriesRail />
      </Suspense>

      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedSection />
      </Suspense>

      <Suspense fallback={<DiscoverSkeleton />}>
        <DiscoverSection />
      </Suspense>
    </>
  )
}
