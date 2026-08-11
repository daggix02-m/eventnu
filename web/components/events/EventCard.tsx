import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Images } from 'lucide-react'
import { cn, formatPrice, formatEventDateShort, isEventPast } from '@/lib/utils'
import { filterStyle } from '@/lib/media'
import { CardQuickActions } from '@/components/social/EventSocialActions'
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
  const images = [...(event.images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const cover = images[0]
  const coverUrl = cover?.url || event.poster_url
  const href = event.slug ? `/events/${event.slug}` : null

  const cardContent = (
    <>
      <div className={cn('relative overflow-hidden', isLg ? 'h-56 md:h-64' : 'h-48')}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={event.title}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            style={{ filter: filterStyle(cover?.filter) }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <span className="text-on-surface-variant font-mono text-label-sm">No image</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-sm right-sm flex items-center gap-xs px-sm py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-label-sm text-label-sm">
            <Images className="w-3.5 h-3.5" />
            {images.length}
          </div>
        )}
        <div
          className={cn(
            'absolute top-sm right-sm px-sm py-1 rounded font-label-sm text-label-sm',
            ended ? 'bg-error text-on-error' : 'bg-black/50 backdrop-blur-md text-white',
          )}
        >
          {ended ? 'ENDED' : formatEventDateShort(event.start_date)}
        </div>
        <CardQuickActions eventId={event.id} className="absolute bottom-sm left-sm" />
      </div>
      <div className={cn('space-y-sm', isLg ? 'p-lg' : 'p-md')}>
        <h3
          className={cn(
            'font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2',
            isLg ? 'font-display text-headline-md' : 'font-headline-md text-body-lg',
          )}
        >
          {event.title}
        </h3>
        <p className="text-on-surface-variant text-body-md line-clamp-1">{event.venue_name}</p>
        {!ended && (
          <div className="flex justify-between items-center pt-sm border-t border-outline-variant/30">
            <span className="text-secondary font-bold text-body-lg">
              {formatPrice(event.price_display, event.is_free)}
            </span>
            {href && (
              <ArrowUpRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        )}
      </div>
    </>
  )

  const cardClass = cn(
    'group bg-surface-container border border-outline-variant rounded-xl overflow-hidden hover:border-primary transition-all duration-300',
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
