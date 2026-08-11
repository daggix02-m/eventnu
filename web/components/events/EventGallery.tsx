'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'
import { filterStyle, aspectClass, sortedImages } from '@/lib/media'
import type { Event, EventImage } from '@/types'

interface EventGalleryProps {
  event: Event
  className?: string
}

export function EventGallery({ event, className }: EventGalleryProps) {
  const images: EventImage[] = sortedImages(event.images)
  const [index, setIndex] = useState(0)
  const count = images.length
  const active = images[index]
  const aspect = aspectClass(event.image_aspect_ratio)
  const containerRef = useRef<HTMLDivElement | null>(null)

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

  if (count === 0 || !active) {
    return null
  }

  return (
    <div ref={containerRef} className={cn('group relative w-full overflow-hidden', className)}>
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
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-sm top-1/2 -translate-y-1/2 p-sm rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 hover:bg-black/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-sm top-1/2 -translate-y-1/2 p-sm rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 hover:bg-black/60"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute top-sm left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-sm py-1 rounded-full font-mono text-label-sm text-white">
            {index + 1} / {count}
          </div>
        </>
      )}

      {event.insta_permalink && (
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

      {count > 1 && (
        <div className="absolute bottom-sm left-1/2 -translate-x-1/2 flex items-center gap-sm px-md py-sm bg-black/40 backdrop-blur-md rounded-full">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              className={cn(
                'w-8 h-8 rounded-md overflow-hidden border-2 transition-all',
                i === index
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={img.url}
                alt=""
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
