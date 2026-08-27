'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { cn, formatPrice, isEventPast } from '@/lib/utils'
import { sortedImages } from '@/lib/media'
import { formatShortDate } from '@/lib/dates'
import {
  CardLikeButton,
  CardBookmarkButton,
  CardShareButton,
} from '@/components/social/EventSocialActions'
import type { DiscoverEvent } from '@/types'

interface SavedEventRowProps {
  event: DiscoverEvent
  categoryName?: string | null
}

/**
 * Compact saved-event row — small thumbnail, title, date/venue, category pill
 * and row actions. Intentionally lighter than the discover `EventCard` so the
 * Saved page reads as a browsable list, not a poster wall.
 */
export function SavedEventRow({ event, categoryName }: SavedEventRowProps) {
  const images = useMemo(() => sortedImages(event.images), [event.images])
  const cover = images[0]
  const imageUrl = cover?.url || event.poster_url || null
  const href = event.slug ? `/events/${event.slug}` : null
  const dateLabel = formatShortDate(event.start_date, event.timezone)
  const ended = isEventPast(event.start_date)

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-2.5 transition-colors hover:border-primary/50 hover:bg-surface-container-high">
      {href ? (
        <Link
          href={href}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-highest"
          aria-label={`Open ${event.title}`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-on-surface-variant">
              No image
            </span>
          )}
        </Link>
      ) : (
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-highest">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-mono text-[10px] text-on-surface-variant">
              No image
            </span>
          )}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-on-surface group-hover:text-primary transition-colors">
          {href ? (
            <Link
              href={href}
              className="rounded-md focus-visible:ring-2 focus-visible:ring-primary"
            >
              {event.title}
            </Link>
          ) : (
            event.title
          )}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-on-surface-variant">
          <MapPin className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{event.venue_name}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {categoryName && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              {categoryName}
            </span>
          )}
          {dateLabel && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold',
                ended
                  ? 'bg-error/15 text-error'
                  : 'bg-surface-container-highest text-on-surface-variant',
              )}
            >
              {ended ? 'Past' : dateLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="font-display text-sm font-bold text-secondary">
          {formatPrice(event.price_display, event.is_free)}
        </span>
        <div className="flex items-center">
          <CardLikeButton eventId={event.id} likeCount={event.like_count} transparent />
          <CardBookmarkButton eventId={event.id} title={event.title} transparent />
          {href && (
            <CardShareButton eventId={event.id} title={event.title} shareUrl={href} transparent />
          )}
        </div>
      </div>
    </div>
  )
}
