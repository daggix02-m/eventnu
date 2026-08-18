import { ExternalLink, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isEventPast } from '@/lib/utils'
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
      className="fixed bottom-[calc(9rem_+_env(safe-area-inset-bottom))] inset-x-0 z-40 md:hidden px-4 pointer-events-none"
      aria-label="Event actions"
    >
      <div className="pointer-events-auto max-w-[32rem] mx-auto bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/70 flex items-center justify-between gap-3">
        {event.external_link ? (
          <Button
            asChild
            size="sm"
            className="rounded-xl font-bold gap-1.5 shrink-0 px-4 py-2 shadow-md"
          >
            <a href={event.external_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              <span>{externalLabel}</span>
            </a>
          </Button>
        ) : event.action_type === 'reservation' ? (
          <Button
            asChild
            size="sm"
            className="rounded-xl font-bold gap-1.5 shrink-0 px-4 py-2 shadow-md"
          >
            <a href="#reserve">
              <Ticket className="w-4 h-4" />
              <span>Reserve</span>
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
