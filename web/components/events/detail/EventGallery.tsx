'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react'
import { cn, isSafeUrl } from '@/lib/utils'
import { filterStyle, aspectClass, sortedImages } from '@/lib/media'
import type { Event, EventImage } from '@/types'

interface EventGalleryProps {
  event: Event
  className?: string
  /** `hero` hides chrome that would collide with the EventHero overlay (thumbnails, counter, Instagram badge). */
  variant?: 'default' | 'hero'
}

/** Minimum horizontal swipe distance (px) before the gallery advances. */
const SWIPE_THRESHOLD = 40

export function EventGallery({ event, className, variant = 'default' }: EventGalleryProps) {
  const images: EventImage[] = sortedImages(event.images)
  const [index, setIndex] = useState(0)
  const count = images.length
  const active = images[index]
  const aspect = aspectClass(event.image_aspect_ratio)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const touchStartX = useRef<number | null>(null)
  const isHero = variant === 'hero'

  const go = useCallback(
    (dir: number) => {
      if (count === 0) return
      setIndex((i) => (i + dir + count) % count)
    },
    [count],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el || count <= 1) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [go, count])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(dx) < SWIPE_THRESHOLD) return
      go(dx < 0 ? 1 : -1)
    },
    [go],
  )

  if (count === 0 || !active) {
    return null
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className={cn('group relative w-full overflow-hidden', className)}
    >
      <div className={cn('relative w-full', aspect)}>
        <Image
          key={active.id}
          src={active.url}
          alt={event.title}
          fill
          priority
          className="object-cover"
          style={{ filter: filterStyle(active.filter) }}
          sizes="100vw"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />

      {count > 1 && (
        <>
          {/* Arrows are always visible on touch (no hover); on fine pointers
              they reveal on hover to keep the image clean. */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-sm top-1/2 -translate-y-1/2 p-sm rounded-full bg-black/40 backdrop-blur-md text-white opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity focus-visible:opacity-100 hover:bg-black/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-sm top-1/2 -translate-y-1/2 p-sm rounded-full bg-black/40 backdrop-blur-md text-white opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 transition-opacity focus-visible:opacity-100 hover:bg-black/60"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Image counter — hidden in hero mode where the status/date badges live */}
          {!isHero && (
            <div className="absolute top-sm left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-sm py-1 rounded-full font-mono text-label-sm text-white">
              {index + 1} / {count}
            </div>
          )}
        </>
      )}

      {/* Instagram badge — hidden in hero mode to avoid colliding with the
          hero's top-right report/status/date badges */}
      {!isHero && event.insta_permalink && isSafeUrl(event.insta_permalink) && (
        <a
          href={event.insta_permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-sm right-sm flex items-center gap-xs bg-black/50 backdrop-blur-md px-sm py-1 rounded-full font-mono text-label-sm text-white hover:bg-[#E1306C]/80 transition-colors"
        >
          <Instagram className="w-3.5 h-3.5" />
          Instagram
        </a>
      )}

      {/* Thumbnail strip — hidden in hero mode where it collides with the
          content overlay and quick actions. Hit areas are 44px so thumbs are
          tappable on a phone; many-image strips scroll horizontally. */}
      {count > 1 && !isHero && (
        <div className="absolute bottom-sm left-1/2 -translate-x-1/2 flex items-center gap-sm px-md py-sm bg-black/40 backdrop-blur-md rounded-full max-w-[85%] overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              className={cn(
                'w-11 h-11 shrink-0 rounded-md overflow-hidden border-2 transition-all',
                i === index
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={img.url}
                alt=""
                width={44}
                height={44}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
