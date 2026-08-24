'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { CalendarDays } from 'lucide-react'
import { DateRailScroller } from './DateRailScroller'
import { ScheduleFilters, type TimeOfDayFilter } from './ScheduleFilters'
import { ScheduleEventCard } from './ScheduleEventCard'
import { ItineraryFloatingDock } from './ItineraryFloatingDock'
import { EmptyScheduleState } from './EmptyScheduleState'
import type { Event, Category } from '@/types'
import { toDateString, getTodayString, nextFriday, getHourInTimeZone } from '@/lib/dates'
import { canSmoothScroll } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ScheduleClientProps {
  events: Event[]
  categories: Category[]
  initialCategory?: string
  initialDate?: string
}

function toLocalDateString(isoString: string): string {
  return toDateString(new Date(isoString))
}

export function ScheduleClient({
  events,
  categories,
  initialCategory,
  initialDate,
}: ScheduleClientProps) {
  const containerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Map of date string -> event count
  const eventDatesMap = useMemo(() => {
    const map: Record<string, number> = {}
    events.forEach((ev) => {
      const dateKey = toLocalDateString(ev.start_date)
      map[dateKey] = (map[dateKey] || 0) + 1
    })
    return map
  }, [events])

  // All distinct dates with events sorted
  const activeDatesList = useMemo(() => {
    return Object.keys(eventDatesMap).sort()
  }, [eventDatesMap])

  // Initial selected date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      return initialDate
    }
    const today = getTodayString()
    if (eventDatesMap[today]) return today
    // If today has no events, find the nearest upcoming date with events
    const upcoming = activeDatesList.find((d) => d >= today)
    return upcoming || today
  })

  const [timeFilter, setTimeFilter] = useState<TimeOfDayFilter>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null)
  const [plannedEvents, setPlannedEvents] = useState<Event[]>([])
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null)
  const [isRollingDice, setIsRollingDice] = useState(false)

  // Filter events for the selected date
  const eventsOnSelectedDate = useMemo(() => {
    return events.filter((ev) => toLocalDateString(ev.start_date) === selectedDate)
  }, [events, selectedDate])

  // Filter by category and time-of-day
  const filteredEvents = useMemo(() => {
    return eventsOnSelectedDate
      .filter((ev) => {
        // Category filter
        if (selectedCategory) {
          const hasCat = ev.event_categories?.some((ec) => ec.categories?.slug === selectedCategory)
          if (!hasCat) return false
        }

        // Time of Day filter
        if (timeFilter !== 'all') {
          const hour = getHourInTimeZone(ev.start_date, ev.timezone)
          if (timeFilter === 'daylight' && hour >= 17) return false
          if (timeFilter === 'golden' && (hour < 17 || hour >= 21)) return false
          if (timeFilter === 'midnight' && hour < 21) return false
        }

        return true
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [eventsOnSelectedDate, selectedCategory, timeFilter])

  // Next active date helper
  const nextDateWithEvents = useMemo(() => {
    return activeDatesList.find((d) => d > selectedDate)
  }, [activeDatesList, selectedDate])

  // GSAP animations
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      if (headerRef.current) {
        gsap.set(headerRef.current, { opacity: 0, y: 15 })
        tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.45 })
      }
    },
    { scope: containerRef },
  )

  useGSAP(
    () => {
      if (listRef.current && filteredEvents.length > 0) {
        const cards = listRef.current.children
        gsap.set(cards, { opacity: 0, y: 16 })
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          ease: 'power2.out',
        })
      }
    },
    { dependencies: [selectedDate, timeFilter, selectedCategory], scope: containerRef },
  )

  // Toggle planned event in custom itinerary
  const handleTogglePlan = useCallback((event: Event) => {
    setPlannedEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id)
      if (exists) {
        return prev.filter((e) => e.id !== event.id)
      } else {
        return [...prev, event]
      }
    })
  }, [])

  const handleClearPlan = useCallback(() => {
    setPlannedEvents([])
  }, [])

  // Spontaneous Roll the Dice Picker
  const handleRollDice = () => {
    if (filteredEvents.length <= 1 || isRollingDice) return
    setIsRollingDice(true)

    let counter = 0
    const totalSteps = 10
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * filteredEvents.length)
      setHighlightedEventId(filteredEvents[randomIdx].id)
      counter++

      if (counter >= totalSteps) {
        clearInterval(interval)
        setIsRollingDice(false)

        // Final random pick
        const finalIdx = Math.floor(Math.random() * filteredEvents.length)
        const picked = filteredEvents[finalIdx]
        setHighlightedEventId(picked.id)

        // Scroll into view smoothly
        setTimeout(() => {
          const el = document.getElementById(`event-card-${picked.id}`)
          if (el) {
            el.scrollIntoView({ behavior: canSmoothScroll() ? 'smooth' : 'auto', block: 'center' })
          }
        }, 100)

        // Reset highlight after 6s
        setTimeout(() => {
          setHighlightedEventId(null)
        }, 6000)
      }
    }, 100)
  }

  // Jump to weekend shortcut
  const handleJumpToWeekend = () => {
    setSelectedDate(toDateString(nextFriday()))
  }

  const handleResetFilters = () => {
    setTimeFilter('all')
    setSelectedCategory(null)
  }

  const formattedDateTitle = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    if (!y || !m || !d) return selectedDate
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }, [selectedDate])

  return (
    <section
      ref={containerRef}
      className="w-full max-w-container-max mx-auto px-4 md:px-gutter py-6 md:py-10 space-y-6 md:space-y-8"
    >
      {/* Header */}
      <div ref={headerRef} className="space-y-2 w-full">
        <div className="flex items-center gap-2 text-primary text-xs font-mono font-semibold uppercase tracking-wider">
          <CalendarDays className="w-4 h-4" />
          <span>City Schedule & Planner</span>
        </div>
        <h1 className="font-display text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight">
          What’s Happening in Addis
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant max-w-[38rem]">
          Pick any date, filter by vibe, and sync your favorite events to your personal calendar in
          one tap.
        </p>
      </div>

      {/* Date Rail Scroller */}
      <section className="space-y-2" aria-label="Date selector">
        <DateRailScroller
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventDatesMap={eventDatesMap}
        />
      </section>

      {/* Filters (Time of Day & Categories) + Roll the Dice */}
      <section className="space-y-3" aria-label="Schedule filters">
        <ScheduleFilters
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onRollDice={handleRollDice}
          isRollingDice={isRollingDice}
          eventsCountOnDate={filteredEvents.length}
        />
      </section>

      {/* Timeline Stream Header */}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg md:text-xl font-bold text-on-surface">
            {formattedDateTitle}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-surface-container-high text-primary border border-outline-variant/40">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>
      </div>

      {/* Timeline Stream / Empty State */}
      {filteredEvents.length > 0 ? (
        <div
          ref={listRef}
          className={cn(
            'w-full space-y-4',
            // When the floating itinerary dock is visible it overlays the
            // bottom of the timeline — pad the list so the last card can
            // scroll above it (MainContent's tab-bar padding isn't enough).
            plannedEvents.length > 0 && 'pb-44',
          )}
        >
          {filteredEvents.map((event) => {
            const isPlanned = plannedEvents.some((e) => e.id === event.id)
            const isHighlighted = highlightedEventId === event.id

            return (
              <ScheduleEventCard
                key={event.id}
                event={event}
                isPlanned={isPlanned}
                onTogglePlan={handleTogglePlan}
                isHighlighted={isHighlighted}
              />
            )
          })}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center">
          <EmptyScheduleState
            onResetFilters={handleResetFilters}
            onJumpToWeekend={handleJumpToWeekend}
            onJumpToNextDateWithEvents={
              nextDateWithEvents ? () => setSelectedDate(nextDateWithEvents) : undefined
            }
            hasNextEventDate={Boolean(nextDateWithEvents)}
          />
        </div>
      )}

      {/* Sticky Floating Itinerary Dock */}
      <ItineraryFloatingDock plannedEvents={plannedEvents} onClearPlan={handleClearPlan} />
    </section>
  )
}
