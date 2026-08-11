import Image from 'next/image'
import { Calendar, MapPin, ExternalLink, Ticket } from 'lucide-react'
import { formatEventDate, formatEventDateShort, isEventPast } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EventGallery } from '@/components/events/EventGallery'
import { hasGallery } from '@/lib/media'
import type { Event } from '@/types'

interface EventHeroProps {
  event: Event
}

function getPrimaryCategory(event: Event) {
  return (
    event.event_categories?.find((ec) => ec.is_primary)?.categories ??
    event.event_categories?.[0]?.categories
  )
}

export function EventHero({ event }: EventHeroProps) {
  const category = getPrimaryCategory(event)
  const externalLabel =
    event.external_link_label?.trim() || (event.is_free ? 'More Info' : 'Get Tickets')
  const ended = isEventPast(event.start_date)
  const showGallery = hasGallery(event.images)

  return (
    <section className="relative w-full overflow-hidden">
      {showGallery ? (
        <EventGallery event={event} className="h-[440px] md:h-[640px]" />
      ) : (
        <div className="relative h-[440px] md:h-[640px] w-full">
          {event.poster_url && (
            <Image
              src={event.poster_url}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <div className="absolute top-gutter left-gutter z-10 flex gap-sm">
        {ended && (
          <span className="bg-error text-on-error px-sm py-1 rounded font-label-sm text-label-sm">
            ENDED
          </span>
        )}
        <span className="bg-black/50 backdrop-blur-md px-sm py-1 rounded font-label-sm text-label-sm text-white">
          {formatEventDateShort(event.start_date)}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-gutter pb-xl">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-md">
            <div className="space-y-sm max-w-[48rem]">
              {category && <Badge variant="default">{category.name.toUpperCase()}</Badge>}
              <h1 className="font-display text-display-lg-mobile md:text-display-lg leading-tight text-on-surface">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-md text-on-surface-variant">
                <div className="flex items-center gap-xs">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-body-md">{formatEventDate(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-xs">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-body-md">
                    {event.venue_name}, {event.venue_address}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-sm w-full md:w-auto">
              {ended ? (
                <Button disabled className="flex-1 md:flex-none">
                  Event Ended
                </Button>
              ) : event.external_link ? (
                <Button asChild className="flex-1 md:flex-none">
                  <a href={event.external_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    {externalLabel}
                  </a>
                </Button>
              ) : event.action_type === 'reservation' ? (
                <Button asChild className="flex-1 md:flex-none">
                  <a href="#reserve">
                    <Ticket className="w-4 h-4" />
                    Reserve a spot
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
