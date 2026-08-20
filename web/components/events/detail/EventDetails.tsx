'use client'

import Image from 'next/image'
import { Play, Calendar, Clock, MapPin, Sparkles, ShieldCheck, Zap, Info } from 'lucide-react'
import { formatEventDate, isSafeUrl } from '@/lib/utils'
import type { Event } from '@/types'

interface EventDetailsProps {
  event: Event
}

export function EventDetails({ event }: EventDetailsProps) {
  const startDate = new Date(event.start_date)
  const timeFormatted = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="space-y-8">
      {/* Quick Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-container-high/70 border border-outline-variant/50">
        <div className="flex flex-col space-y-1 p-2 rounded-xl bg-surface-container/50">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Date</span>
          </div>
          <p className="font-display font-bold text-sm text-on-surface truncate">
            {formatEventDate(event.start_date)}
          </p>
        </div>

        <div className="flex flex-col space-y-1 p-2 rounded-xl bg-surface-container/50">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Time</span>
          </div>
          <p className="font-display font-bold text-sm text-on-surface truncate">{timeFormatted}</p>
        </div>

        <div className="flex flex-col space-y-1 p-2 rounded-xl bg-surface-container/50">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-tertiary" />
            <span>Location</span>
          </div>
          <p
            className="font-display font-bold text-sm text-on-surface truncate"
            title={event.venue_name}
          >
            {event.venue_name}
          </p>
        </div>
      </div>

      {/* About Description Section */}
      <section className="space-y-4 p-6 sm:p-8 rounded-2xl bg-surface-container/40 border border-outline-variant/40">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-6 rounded-full bg-primary" />
            <h2 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
              About this Event
            </h2>
          </div>
          <span className="flex items-center gap-1 text-xs font-mono text-on-surface-variant">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>Overview</span>
          </span>
        </div>

        {event.subtitle && (
          <blockquote className="p-4 rounded-xl bg-primary-container/50 text-on-primary-container border border-primary/20 text-base font-medium leading-relaxed">
            &ldquo;{event.subtitle}&rdquo;
          </blockquote>
        )}

        <div className="font-body-md text-base sm:text-lg text-on-surface-variant leading-relaxed space-y-4 whitespace-pre-line break-words">
          {event.description}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-outline-variant/30">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest/80 border border-outline-variant/50 text-xs font-medium text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Verified Event
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest/80 border border-outline-variant/50 text-xs font-medium text-on-surface-variant">
            <Zap className="w-3.5 h-3.5 text-secondary" />
            Fast Entry Access
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-highest/80 border border-outline-variant/50 text-xs font-medium text-on-surface-variant">
            <Sparkles className="w-3.5 h-3.5 text-tertiary" />
            Addis Ababa Experience
          </span>
        </div>
      </section>

      {/* Teaser Video Preview if Available */}
      {event.teaser_video_url && (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-6 rounded-full bg-secondary" />
            <h3 className="font-display text-lg sm:text-xl font-bold text-on-surface">
              Watch Event Teaser
            </h3>
          </div>

          <button
            type="button"
            className="relative w-full aspect-video rounded-2xl overflow-hidden group text-left bg-surface-container-high border border-outline-variant/50 shadow-xl shadow-black/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary transition-all duration-300 hover:border-primary/60"
            aria-label="Play event teaser video"
            onClick={() => {
              if (event.teaser_video_url && isSafeUrl(event.teaser_video_url)) {
                window.open(event.teaser_video_url, '_blank', 'noopener,noreferrer')
              }
            }}
          >
            {event.poster_url && (
              <Image
                src={event.poster_url}
                alt={`${event.title} teaser`}
                fill
                className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/95 rounded-full flex items-center justify-center text-on-primary shadow-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-200">
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-on-primary ml-1" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 font-mono text-xs font-bold text-white uppercase tracking-wider">
                ▶ Watch Official Teaser
              </span>
            </div>
          </button>
        </section>
      )}
    </div>
  )
}
