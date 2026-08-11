import { ExternalLink, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice, formatEventDateShort, isEventPast } from '@/lib/utils'
import type { Event } from '@/types'

interface EventStickyCTAProps {
  event: Event
}

export function EventStickyCTA({ event }: EventStickyCTAProps) {
  if (isEventPast(event.start_date)) return null

  const externalLabel =
    event.external_link_label?.trim() || (event.is_free ? 'More Info' : 'Get Tickets')

  return (
    <div
      className="sticky bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))] z-40 md:hidden bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant"
      aria-label="Event actions"
    >
      <div className="flex items-center justify-between gap-md px-gutter py-sm">
        <div className="min-w-0">
          <p className="text-secondary font-bold text-body-lg truncate">
            {formatPrice(event.price_display, event.is_free)}
          </p>
          <p className="text-label-sm text-on-surface-variant truncate">
            {formatEventDateShort(event.start_date)}
          </p>
        </div>
        {event.external_link ? (
          <Button asChild size="lg" className="flex-shrink-0">
            <a href={event.external_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              {externalLabel}
            </a>
          </Button>
        ) : event.action_type === 'reservation' ? (
          <Button asChild size="lg" className="flex-shrink-0">
            <a href="#reserve">
              <Ticket className="w-4 h-4" />
              Reserve a spot
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
