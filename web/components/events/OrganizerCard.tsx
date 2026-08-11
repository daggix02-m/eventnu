import Image from 'next/image'
import { CalendarDays } from 'lucide-react'
import type { Event } from '@/types'

interface OrganizerCardProps {
  event: Event
}

export function OrganizerCard({ event }: OrganizerCardProps) {
  if (!event.organizer) return null

  const displayName = event.organizer.full_name || event.organizer.email || 'Event Organizer'

  return (
    <div className="p-lg bg-surface-container-low border border-outline-variant rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-md">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container bg-surface-container-highest">
          {event.organizer.avatar_url ? (
            <Image
              src={event.organizer.avatar_url}
              alt={displayName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <CalendarDays className="w-6 h-6" />
            </div>
          )}
        </div>
        <div>
          <p className="font-mono text-label-sm text-tertiary">Organized by</p>
          <h3 className="font-display text-headline-md">{displayName}</h3>
        </div>
      </div>
    </div>
  )
}
