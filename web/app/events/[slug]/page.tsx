import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { EventHero } from '@/components/events/EventHero'
import { EventStickyCTA } from '@/components/events/EventStickyCTA'
import { EventDetails } from '@/components/events/EventDetails'
import { EventPhotoGrid } from '@/components/events/EventPhotoGrid'
import { EventInfoCard } from '@/components/events/EventInfoCard'
import { EventExperiences } from '@/components/events/EventExperiences'
import { ReservationForm } from '@/components/events/ReservationForm'
import { OrganizerCard } from '@/components/events/OrganizerCard'
import { SimilarEvents } from '@/components/events/SimilarEvents'
import { getEventBySlug, getSimilarEvents } from '@/lib/api/events'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

interface EventPageProps {
  params: Promise<{ slug: string }>
}

function toAbsolute(image?: string | null): string | undefined {
  if (!image) return undefined
  return image.startsWith('/') ? absoluteUrl(image) : image
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    return { title: 'Event Not Found | Event Nu' }
  }

  const description = event.subtitle ?? event.description.slice(0, 160)

  return {
    title: `${event.title} | Event Nu`,
    description,
    openGraph: {
      title: event.title,
      description,
      images: toAbsolute(event.poster_url) ? [toAbsolute(event.poster_url)!] : [],
      url: absoluteUrl(`/events/${event.slug}`),
      type: 'website',
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const similarEvents = await getSimilarEvents(event, 3)

  const hasEnded = new Date(event.start_date).getTime() < Date.now()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.subtitle ?? event.description.slice(0, 500),
    startDate: event.start_date,
    endDate: event.end_date ?? undefined,
    url: absoluteUrl(`/events/${event.slug}`),
    image: toAbsolute(event.poster_url ?? event.images?.[0]?.url),
    location: {
      '@type': 'Place',
      name: event.venue_name,
      address: event.venue_address ?? undefined,
    },
    organizer: event.organizer
      ? { '@type': 'Organization', name: event.organizer.full_name ?? 'Event Organizer' }
      : undefined,
    eventStatus: hasEnded ? 'https://schema.org/EventEnded' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <EventHero event={event} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 md:pb-16">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full">
          {/* Left / Main Content Column */}
          <div className="w-full lg:col-span-7 xl:col-span-8 space-y-8 min-w-0">
            <EventDetails event={event} />

            {/* Photos Showcase */}
            {event.images && event.images.length > 1 && (
              <section className="space-y-4 p-6 sm:p-8 rounded-2xl bg-surface-container/40 border border-outline-variant/40">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full bg-primary" />
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
                      Event Gallery
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {event.images.length} photos
                  </span>
                </div>
                <EventPhotoGrid images={event.images} eventTitle={event.title} />
              </section>
            )}

            <OrganizerCard event={event} />
            <EventExperiences eventId={event.id} />
          </div>

          {/* Right / Sidebar Column */}
          <div className="w-full lg:col-span-5 xl:col-span-4 space-y-6 min-w-0">
            <EventInfoCard event={event} />
            {event.action_type === 'reservation' && (
              <div id="reserve" className="scroll-mt-24">
                <ReservationForm event={event} />
              </div>
            )}
          </div>
        </div>
      </div>
      <SimilarEvents events={similarEvents} />
      <EventStickyCTA event={event} />
    </>
  )
}
