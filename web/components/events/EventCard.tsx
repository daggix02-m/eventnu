'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { ArrowUpRight, Images, MapPin } from 'lucide-react'
import { cn, formatPrice, formatEventDateShort, isEventPast } from '@/lib/utils'
import { filterStyle } from '@/lib/media'
import { CardQuickActions } from '@/components/social/EventSocialActions'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import type { Event } from '@/types'

interface EventCardProps {
  event: Event
  className?: string
  size?: 'lg' | 'default'
  priority?: boolean
}

export function EventCard({
  event,
  className,
  size = 'default',
  priority = false,
}: EventCardProps) {
  const ended = isEventPast(event.start_date)
  const isLg = size === 'lg'
  const images = useMemo(
    () => [...(event.images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [event.images],
  )
  const cover = images[0]
  const coverUrl = cover?.url || event.poster_url
  const href = event.slug ? `/events/${event.slug}` : null
  const primaryCategory = event.event_categories?.[0]?.categories?.name

  const cardContent = (
    <>
      <div
        className={cn(
          'relative overflow-hidden bg-surface-container-highest',
          isLg ? 'h-56 md:h-64' : 'h-48',
        )}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={event.title}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ filter: filterStyle(cover?.filter) }}
            sizes="(max-width: 768px) 270px, (max-width: 1200px) 300px, 350px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-on-surface-variant font-mono text-xs">No image</span>
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {primaryCategory ? (
            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[10px] font-bold text-white uppercase tracking-wider">
              {primaryCategory}
            </span>
          ) : (
            <span />
          )}

          <div
            className={cn(
              'px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider',
              ended
                ? 'bg-error text-on-error'
                : 'bg-black/60 backdrop-blur-md border border-white/10 text-white',
            )}
          >
            {ended ? 'ENDED' : formatEventDateShort(event.start_date)}
          </div>
        </div>

        {/* Bottom Overlays */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[11px]">
            <Images className="w-3 h-3" />
            <span>{images.length}</span>
          </div>
        )}

        <div className="pointer-events-auto">
          <CardQuickActions eventId={event.id} className="absolute bottom-2.5 right-2.5" />
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col justify-between flex-1 space-y-2.5',
          isLg ? 'p-5 md:p-6' : 'p-4',
        )}
      >
        <div className="space-y-1">
          <h3
            className={cn(
              'font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2',
              isLg
                ? 'font-display text-xl md:text-2xl leading-snug'
                : 'font-display text-base sm:text-lg leading-snug',
            )}
          >
            {event.title}
          </h3>
          <p className="flex items-center gap-1 text-on-surface-variant text-xs sm:text-sm line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </p>
          {event.organizer && (
            <p className="flex items-center gap-1.5 pt-1 text-xs text-on-surface-variant line-clamp-1">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest">
                {event.organizer.logo_url ? (
                  <Image
                    src={event.organizer.logo_url}
                    alt=""
                    width={20}
                    height={20}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-bold text-primary">
                    {(event.organizer.full_name || 'O').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="truncate">{event.organizer.full_name || 'Organizer'}</span>
              {event.organizer.verified && <VerifiedBadge compact />}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center pt-2.5 border-t border-outline-variant/30 mt-auto">
          <span className="text-secondary font-bold text-sm sm:text-base font-display">
            {formatPrice(event.price_display, event.is_free)}
          </span>
          {href && (
            <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-all">
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          )}
        </div>
      </div>
    </>
  )

  const cardClass = cn(
    'group flex flex-col bg-surface-container-high/80 border border-outline-variant/50 rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-xl hover:shadow-black/40 transition-all duration-300',
    isLg && 'lg:col-span-2',
    className,
  )

  if (!href) {
    return <div className={cardClass}>{cardContent}</div>
  }

  return (
    <Link href={href} className={cardClass}>
      {cardContent}
    </Link>
  )
}
