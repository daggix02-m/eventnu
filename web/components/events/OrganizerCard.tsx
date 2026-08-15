import Image from 'next/image'
import { CalendarDays, ShieldCheck, UserCheck } from 'lucide-react'
import type { Event } from '@/types'

interface OrganizerCardProps {
  event: Event
}

export function OrganizerCard({ event }: OrganizerCardProps) {
  if (!event.organizer) return null

  const displayName = event.organizer.full_name || 'Event Organizer'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="p-6 rounded-2xl bg-surface-container-high/60 border border-outline-variant/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-outline-variant/60 bg-surface-container-highest flex items-center justify-center shrink-0">
          {event.organizer.avatar_url ? (
            <Image
              src={event.organizer.avatar_url}
              alt={displayName}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display font-bold text-base text-primary">
              {initials || <CalendarDays className="w-5 h-5 text-primary" />}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Event Organizer
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-[9px] font-bold">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface truncate">
            {displayName}
          </h3>
          <p className="text-xs text-on-surface-variant">
            Official Host on Event Nu
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest/60 border border-outline-variant/40 text-xs font-semibold text-on-surface-variant shrink-0">
        <UserCheck className="w-3.5 h-3.5 text-primary" />
        <span>Verified Creator</span>
      </div>
    </section>
  )
}
