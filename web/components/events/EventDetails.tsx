'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'
import type { Event } from '@/types'

interface EventDetailsProps {
  event: Event
}

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="space-y-xl">
      <div className="space-y-md">
        <h2 className="font-display text-headline-md border-l-4 border-primary pl-md">
          About the Event
        </h2>
        <div className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed space-y-md whitespace-pre-line">
          {event.description}
        </div>
      </div>

      {event.teaser_video_url && (
        <button
          type="button"
          className="relative w-full aspect-video rounded-xl overflow-hidden glass-card group text-left bg-surface-container-high"
          aria-label="Play event teaser video"
          onClick={() =>
            event.teaser_video_url &&
            window.open(event.teaser_video_url, '_blank', 'noopener,noreferrer')
          }
        >
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center text-on-primary shadow-xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
              <Play className="w-10 h-10 fill-on-primary" />
            </div>
          </div>
          {event.poster_url && (
            <Image
              src={event.poster_url}
              alt={`${event.title} teaser`}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          )}
          <div className="absolute bottom-md left-md">
            <p className="font-mono text-label-sm text-white uppercase tracking-widest">
              Watch Teaser
            </p>
          </div>
        </button>
      )}
    </div>
  )
}
