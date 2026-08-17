import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, UserCheck } from 'lucide-react'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import type { Event } from '@/types'

export function OrganizerCard({ event }: { event: Event }) {
  if (!event.organizer) return null

  const displayName = event.organizer.full_name || 'Event Organizer'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const profileHref = event.organizer.handle ? `/organizer/${event.organizer.handle}` : null

  const avatar = (
    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-outline-variant/60 bg-surface-container-highest flex items-center justify-center shrink-0">
      {event.organizer.logo_url || event.organizer.avatar_url ? (
        <Image
          src={event.organizer.logo_url ?? event.organizer.avatar_url ?? ''}
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
  )

  const identity = (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[11px] font-semibold text-secondary uppercase tracking-wider">
          Event Organizer
        </span>
        {event.organizer.verified && <VerifiedBadge compact />}
      </div>
      <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface truncate">
        {displayName}
      </h3>
      {event.organizer.handle && (
        <p className="font-mono text-[11px] text-on-surface-variant">@{event.organizer.handle}</p>
      )}
    </div>
  )

  return (
    <section className="p-6 rounded-2xl bg-surface-container-high/60 border border-outline-variant/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {profileHref ? (
          <Link
            href={profileHref}
            className="shrink-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary"
          >
            {avatar}
          </Link>
        ) : (
          avatar
        )}
        {profileHref ? (
          <Link
            href={profileHref}
            className="min-w-0 focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            {identity}
          </Link>
        ) : (
          identity
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-highest/60 border border-outline-variant/40 text-xs font-semibold text-on-surface-variant shrink-0">
        <UserCheck className="w-3.5 h-3.5 text-primary" />
        <span>{event.organizer.verified ? 'Verified Organizer' : 'Organizer'}</span>
      </div>
    </section>
  )
}
