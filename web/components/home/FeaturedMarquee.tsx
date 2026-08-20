'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { filterStyle, sortedImages } from '@/lib/media'
import type { Event } from '@/types'

interface FeaturedMarqueeProps {
  events: Event[]
}

const PX_PER_SECOND = 80

function getPrimaryCategory(event: Event) {
  return (
    event.event_categories?.find((ec) => ec.is_primary)?.categories ??
    event.event_categories?.[0]?.categories
  )
}

function formatShortDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

/**
 * FeaturedMarquee — infinite horizontal scroll marquee.
 *
 * Dual identical tracks (A + B) give a seamless visual loop. The RAF loop
 * shifts `translateX` at a steady pace. On hover the auto-scroll pauses and
 * the user can scroll manually — vertical mouse wheel / trackpad gestures are
 * converted to horizontal movement. On mouse leave the auto-scroll resumes.
 */
export function FeaturedMarquee({ events }: FeaturedMarqueeProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number>(0)
  const hoveredRef = useRef(false)
  const touchRef = useRef({ active: false, startX: 0, lastX: 0 })
  const translateRef = useRef(0)
  const trackWidthRef = useRef(0)
  // True when the device has a real pointer that hovers (mouse/trackpad).
  // iOS/Android tap-to-hover emulation must NOT pause the auto-scroll.
  const canHoverRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const mqHover = window.matchMedia('(hover: hover)')
    canHoverRef.current = mqHover.matches
  }, [])

  // Measure one track's width for the infinite-loop reset
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return
      const row = trackRef.current.parentElement
      if (row) trackWidthRef.current = row.scrollWidth / 2
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [events.length])

  // Auto-scroll loop
  useEffect(() => {
    if (events.length === 0 || prefersReducedMotion) return

    let lastTime = performance.now()

    const tick = (now: number) => {
      // Clamp to 0.25s so a throttled rAF (iOS scroll/GPU contention) still
      // advances the strip instead of stalling, without a huge jump after a
      // long pause (tab switch).
      const dt = Math.min((now - lastTime) / 1000, 0.25)
      lastTime = now

      if (!hoveredRef.current) {
        translateRef.current -= PX_PER_SECOND * dt

        const tw = trackWidthRef.current
        if (tw > 0 && Math.abs(translateRef.current) >= tw) {
          translateRef.current += tw
        }
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${translateRef.current}px, 0, 0)`
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [events.length, prefersReducedMotion])

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Hover: pause auto-scroll (desktop only — touch devices must not pause)
  const onMouseEnter = useCallback(() => {
    if (canHoverRef.current) hoveredRef.current = true
  }, [])

  const onMouseLeave = useCallback(() => {
    if (canHoverRef.current) hoveredRef.current = false
  }, [])

  // Wheel → horizontal scroll when hovered
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!canHoverRef.current || !hoveredRef.current || !trackRef.current) return

    // Use deltaX if horizontal scroll, otherwise use deltaY
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (delta === 0) return

    translateRef.current -= delta

    // Snap during manual scroll
    const tw = trackWidthRef.current
    if (tw > 0) {
      if (translateRef.current <= -tw) translateRef.current += tw
      if (translateRef.current > 0) translateRef.current -= tw
    }

    trackRef.current.style.transform = `translate3d(${translateRef.current}px, 0, 0)`
  }, [])

  // Touch handlers — pause auto-scroll on touch, allow manual swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    hoveredRef.current = true
    touchRef.current = { active: true, startX: e.touches[0].clientX, lastX: e.touches[0].clientX }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.active || !trackRef.current) return

    const dx = e.touches[0].clientX - touchRef.current.lastX
    touchRef.current.lastX = e.touches[0].clientX

    translateRef.current += dx

    // Snap during manual scroll
    const tw = trackWidthRef.current
    if (tw > 0) {
      if (translateRef.current <= -tw) translateRef.current += tw
      if (translateRef.current > 0) translateRef.current -= tw
    }

    trackRef.current.style.transform = `translate3d(${translateRef.current}px, 0, 0)`
  }, [])

  // iOS Safari fires `touchcancel` (not `touchend`) when it takes over a
  // gesture for page scrolling — without this the auto-scroll stayed paused
  // forever on iPhones after the first touch.
  const endTouch = useCallback(() => {
    touchRef.current.active = false
    hoveredRef.current = false
  }, [])

  const onTouchEnd = endTouch
  const onTouchCancel = endTouch

  // Render each card
  const renderCard = useCallback((event: Event, index: number) => {
    const images = sortedImages(event.images)
    const cover = images[0]
    const imageUrl = cover?.url || event.poster_url || null
    const imgFilter = cover?.filter ?? null
    const category = getPrimaryCategory(event)
    const href = event.slug ? `/events/${event.slug}` : null
    const dateLabel = formatShortDate(event.start_date)

    return (
      <Link
        key={`${event.id}-${index}`}
        href={href ?? '#'}
        className={cn(
          'w-52 md:w-64 lg:w-72 h-72 md:h-[23rem] lg:h-[26rem]',
          'relative group rounded-2xl overflow-hidden flex-shrink-0',
          'transition-shadow duration-300 ease-out',
          'hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        tabIndex={href ? 0 : -1}
        aria-label={`${event.title} — ${category?.name ?? 'Event'}`}
      >
        {/* Image */}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            style={{ filter: filterStyle(imgFilter) }}
            sizes="(max-width: 768px) 208px, (max-width: 1024px) 256px, 288px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <span className="text-on-surface-variant font-mono text-xs">No image</span>
          </div>
        )}

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Category badge */}
        {category && (
          <span className="absolute top-3 left-3 md:top-4 md:left-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] md:text-[11px] font-bold uppercase tracking-wider z-10">
            {category.name}
          </span>
        )}

        {/* Date badge */}
        {dateLabel && (
          <span className="absolute top-3 right-3 md:top-4 md:right-4 px-2 py-1 rounded-full bg-primary/80 backdrop-blur-md text-on-primary font-mono text-[10px] md:text-[11px] font-bold z-10">
            {dateLabel}
          </span>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 z-10">
          <p className="text-white text-sm md:text-base lg:text-lg font-semibold line-clamp-2 leading-snug">
            {event.title}
          </p>
          <p className="text-white/60 text-xs md:text-sm mt-1.5 line-clamp-1">{event.venue_name}</p>
        </div>

        {/* Bottom accent line on hover */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />
      </Link>
    )
  }, [])

  if (events.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden py-2">
      {/* Left fade */}
      <div className="absolute left-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none bg-gradient-to-r from-background to-transparent" />

      {/* Scrollable track */}
      <div
        ref={containerRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        style={{ cursor: 'grab', touchAction: 'pan-y' }}
        aria-label="Featured events marquee"
        role="region"
      >
        <div
          ref={trackRef}
          className="flex gap-3 md:gap-4 lg:gap-5 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {/* Track A */}
          <div className="flex gap-3 md:gap-4 lg:gap-5 shrink-0">
            {events.map((event, i) => renderCard(event, i))}
          </div>
          {/* Track B — identical clone for seamless infinite loop */}
          <div className="flex gap-3 md:gap-4 lg:gap-5 shrink-0">
            {events.map((event, i) => renderCard(event, i + events.length))}
          </div>
        </div>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}
