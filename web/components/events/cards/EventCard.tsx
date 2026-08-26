'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { cn, formatPrice, isEventPast } from '@/lib/utils'
import { filterStyle, sortedImages } from '@/lib/media'
import { formatShortDate } from '@/lib/dates'
import { CardQuickActions, useCardLike } from '@/components/social/EventSocialActions'
import { VerifiedBadge } from '@/components/verification/VerifiedBadge'
import type { DiscoverEvent } from '@/types'

interface EventCardProps {
  event: DiscoverEvent
  className?: string
  size?: 'lg' | 'default'
  priority?: boolean
}

function getPrimaryCategory(event: DiscoverEvent) {
  return (
    event.event_categories?.find((ec) => ec.is_primary)?.categories ??
    event.event_categories?.[0]?.categories
  )
}

/**
 * EventCard — unified card design matching the FeaturedMarquee style.
 *
 * Full-bleed image with gradient scrim, category + date badges on the image,
 * and a compact content section below with title, venue, organizer, price,
 * and social actions (like / bookmark / share).
 */
export function EventCard({
  event,
  className,
  size = 'default',
  priority = false,
}: EventCardProps) {
  const ended = isEventPast(event.start_date)
  const isLg = size === 'lg'
  const images = useMemo(() => sortedImages(event.images), [event.images])
  const cover = images[0]
  const imageUrl = cover?.url || event.poster_url || null
  const imgFilter = cover?.filter ?? null
  const href = event.slug ? `/events/${event.slug}` : null
  const category = getPrimaryCategory(event)
  const dateLabel = formatShortDate(event.start_date, event.timezone)

  const { toggle: toggleLike } = useCardLike(event.id)

  // Instagram-style double-tap to like. The visible action buttons already
  // stop propagation on click, and this skips interactive targets so a
  // double-tap on the like button or a link never fires a second toggle.
  const handleCardDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('a, button, [role="button"]')) return
    toggleLike()
  }

  const cardContent = (
    <>
      {/* Full-bleed image area */}
      <div
        className={cn(
          'relative overflow-hidden bg-surface-container-highest',
          isLg ? 'h-56 md:h-64' : 'h-44 sm:h-52',
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ filter: filterStyle(imgFilter) }}
            sizes="(max-width: 768px) 270px, (max-width: 1200px) 300px, 350px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-on-surface-variant font-mono text-xs">No image</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* Category badge — top left */}
        {category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] font-bold uppercase tracking-wider z-10">
            {category.name}
          </span>
        )}

        {/* Date badge — top right */}
        {dateLabel && (
          <span
            className={cn(
              'absolute top-3 right-3 px-2 py-1 rounded-full backdrop-blur-md font-mono text-[10px] font-bold z-10',
              ended ? 'bg-error/80 text-on-error' : 'bg-primary/80 text-on-primary',
            )}
          >
            {ended ? 'ENDED' : dateLabel}
          </span>
        )}

        {/* Image count badge */}
        {images.length > 1 && (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] z-10">
            {images.length} photos
          </span>
        )}

        {/* Social actions — like / bookmark / share, horizontal row */}
        <div className="pointer-events-auto">
          <CardQuickActions
            eventId={event.id}
            title={event.title}
            shareUrl={href ?? undefined}
            likeCount={event.like_count}
            compact
            direction="row"
            className="absolute bottom-3 right-3 z-10"
          />
        </div>
      </div>

      {/* Content section */}
      <div className={cn('flex flex-col justify-between flex-1', isLg ? 'p-5 md:p-6' : 'p-4')}>
        <div className="space-y-1.5">
          {/* Title */}
          <h3
            className={cn(
              'font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug',
              isLg ? 'text-lg md:text-xl' : 'text-sm md:text-base',
            )}
          >
            {href ? (
              <Link
                href={href}
                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {event.title}
              </Link>
            ) : (
              event.title
            )}
          </h3>

          {/* Venue */}
          <p className="flex items-center gap-1 text-on-surface-variant text-xs line-clamp-1">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </p>

          {/* Organizer */}
          {event.organizer && (
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-on-surface-variant line-clamp-1">
              <Link
                href={event.organizer.handle ? `/organizer/${event.organizer.handle}` : '#'}
                onClick={(e) => {
                  if (!event.organizer?.handle) e.preventDefault()
                }}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-md focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={
                  event.organizer.handle
                    ? `View ${event.organizer.full_name || 'organizer'} profile`
                    : undefined
                }
              >
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest">
                  {event.organizer.logo_url ? (
                    <Image
                      src={event.organizer.logo_url}
                      alt=""
                      width={16}
                      height={16}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-primary">
                      {(event.organizer.full_name || 'O').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="truncate">{event.organizer.full_name || 'Organizer'}</span>
              </Link>
              {event.organizer.verified && <VerifiedBadge compact />}
            </p>
          )}
        </div>

        {/* Price footer */}
        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-outline-variant/30">
          <span className="text-secondary font-bold text-xs sm:text-sm font-display">
            {formatPrice(event.price_display, event.is_free)}
          </span>
          {href && (
            <Link
              href={href}
              className="text-[11px] font-semibold text-primary hover:text-primary-fixed transition-colors"
            >
              View details
            </Link>
          )}
        </div>
      </div>
    </>
  )

  const cardClass = cn(
    'group flex flex-col bg-surface-container-high/80 border border-outline-variant/50 rounded-2xl overflow-hidden',
    'hover:border-primary/60 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-all duration-300',
    // Double-tap-to-like needs fast taps (no zoom delay) and no text selection
    // when the double-click fires on a phone.
    'select-none touch-manipulation',
    isLg && 'lg:col-span-2',
    className,
  )

  return (
    <div className={cardClass} onDoubleClick={handleCardDoubleClick}>
      {cardContent}
    </div>
  )
}
