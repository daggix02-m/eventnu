import { EventCard } from './EventCard'
import { isEventPast } from '@/lib/utils'
import type { Event } from '@/types'

interface SimilarEventsProps {
  events: Event[]
}

export function SimilarEvents({ events }: SimilarEventsProps) {
  const upcoming = events.filter((e) => !isEventPast(e.start_date))
  if (upcoming.length === 0) return null

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14 pb-24 md:pb-14 bg-surface-container-lowest border-t border-outline-variant/30">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface">
            More Experiences You Might Like
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Discover curated events happening soon around Addis Ababa
          </p>
        </div>

        {/* Mobile: Horizontal scroll rail; Desktop: Grid */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible scrollbar-none snap-x snap-start py-1">
            {upcoming.map((event, i) => (
              <div
                key={event.id}
                className="w-[220px] sm:w-auto shrink-0 snap-start flex flex-col"
              >
                <EventCard event={event} priority={i === 0} className="h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
