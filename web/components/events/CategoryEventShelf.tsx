'use client'

import { useRef, useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Music,
  Palette,
  Moon,
  UtensilsCrossed,
  Activity,
  Cpu,
  Heart,
  Calendar,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventCard } from './EventCard'
import type { Event, Category } from '@/types'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  music: Music,
  'arts-culture': Palette,
  nightlife: Moon,
  'food-drink': UtensilsCrossed,
  'sports-fitness': Activity,
  'tech-innovation': Cpu,
  family: Heart,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  music: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  'arts-culture': {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
  },
  nightlife: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  'food-drink': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  'sports-fitness': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  'tech-innovation': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
  family: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
}

interface CategoryEventShelfProps {
  category: Category | { slug: string; name: string; id?: string }
  events: Event[]
  onSelectCategory?: (slug: string) => void
  priorityFirst?: boolean
  className?: string
}

export function CategoryEventShelf({
  category,
  events,
  onSelectCategory,
  priorityFirst = false,
  className,
}: CategoryEventShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const Icon = CATEGORY_ICONS[category.slug] || Calendar
  const colorTheme = CATEGORY_COLORS[category.slug] || {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  }

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return

    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [events.length])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (events.length === 0) return null

  return (
    <section className={cn('space-y-sm group/shelf', className)} aria-label={category.name}>
      {/* Header */}
      <div className="flex items-center justify-between gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shrink-0',
              colorTheme.bg,
              colorTheme.text,
              colorTheme.border,
            )}
          >
            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="font-display text-headline-sm sm:text-headline-md font-bold text-on-surface truncate">
              {category.name}
            </h3>
            <span className="font-mono text-[11px] text-on-surface-variant shrink-0">
              ({events.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-xs">
          {/* Scroll Nav Buttons (Visible on desktop/tablet) */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${category.name} events left`}
              className={cn(
                'p-1.5 rounded-full border border-outline-variant/60 bg-surface-container-high/60 backdrop-blur-md text-on-surface transition-all active:scale-95',
                canScrollLeft
                  ? 'hover:bg-primary hover:text-on-primary hover:border-primary opacity-100 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed',
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${category.name} events right`}
              className={cn(
                'p-1.5 rounded-full border border-outline-variant/60 bg-surface-container-high/60 backdrop-blur-md text-on-surface transition-all active:scale-95',
                canScrollRight
                  ? 'hover:bg-primary hover:text-on-primary hover:border-primary opacity-100 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed',
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* See All Pill Button */}
          {onSelectCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(category.slug)}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-fixed transition-colors px-2.5 py-1 rounded-full hover:bg-primary/10"
            >
              <span>See all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="relative -mx-gutter px-gutter md:mx-0 md:px-0">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-contain scrollbar-none snap-x snap-mandatory py-1 scroll-smooth touch-pan-x"
        >
          {events.map((event, index) => (
            <div key={event.id} className="w-[260px] sm:w-[290px] md:w-[320px] shrink-0 snap-start">
              <EventCard event={event} priority={priorityFirst && index === 0} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
