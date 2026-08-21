'use client'

import { useRef, useEffect, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { MiniCalendarModal } from './MiniCalendarModal'
import { cn } from '@/lib/utils'
import { toDateString, nextFriday } from '@/lib/dates'
import { canSmoothScroll } from '@/lib/utils'

interface DateRailScrollerProps {
  selectedDate: string // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void
  eventDatesMap: Record<string, number> // 'YYYY-MM-DD' -> count
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getUpcomingDates(daysCount = 45): Array<{
  dateStr: string
  dayName: string
  dayNumber: number
  monthName: string
  isToday: boolean
  isWeekend: boolean
}> {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayOfWeek = d.getDay()

    dates.push({
      dateStr: toDateString(d),
      dayName: SHORT_DAYS[dayOfWeek],
      dayNumber: d.getDate(),
      monthName: SHORT_MONTHS[d.getMonth()],
      isToday: i === 0,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0, // Fri, Sat, Sun in Addis nightlife
    })
  }
  return dates
}

export function DateRailScroller({
  selectedDate,
  onSelectDate,
  eventDatesMap,
}: DateRailScrollerProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [datesList] = useState(() => getUpcomingDates(45))

  const todayStr = toDateString(new Date())
  // Scroll active item into view smoothly
  useEffect(() => {
    if (!scrollContainerRef.current) return
    const activeEl = scrollContainerRef.current.querySelector<HTMLElement>(
      `[data-date="${selectedDate}"]`,
    )
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: canSmoothScroll() ? 'smooth' : 'auto',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [selectedDate])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -260,
        behavior: canSmoothScroll() ? 'smooth' : 'auto',
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 260,
        behavior: canSmoothScroll() ? 'smooth' : 'auto',
      })
    }
  }

  // Quick preset shortcuts
  const handleSelectToday = () => onSelectDate(todayStr)

  const handleSelectTomorrow = () => {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    onSelectDate(toDateString(t))
  }

  const handleSelectWeekend = () => {
    onSelectDate(toDateString(nextFriday()))
  }

  return (
    <div className="space-y-3 w-full">
      {/* Quick Jump Presets & Calendar Trigger */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSelectToday}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 border',
              selectedDate === todayStr
                ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                : 'bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border-outline-variant/40',
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleSelectTomorrow}
            className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/40 transition-all duration-200"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={handleSelectWeekend}
            className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight bg-surface-container-high/70 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/40 transition-all duration-200 flex items-center gap-1"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>This Weekend</span>
          </button>
        </div>

        {/* Full Month Calendar Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-all duration-200"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>All Dates</span>
        </button>
      </div>

      {/* Date Rail Slider — desktop: arrow nav; mobile: touch scroll */}
      <div className="flex items-center gap-2">
        {/* Left Arrow — always visible on desktop */}
        <button
          type="button"
          onClick={scrollLeft}
          aria-label="Scroll dates left"
          className="hidden md:flex shrink-0 w-9 h-9 rounded-2xl bg-surface-container-high/80 hover:bg-surface-container-highest border border-outline-variant/60 hover:border-primary/40 text-on-surface-variant hover:text-primary items-center justify-center shadow-md transition-all duration-200 active:scale-95 backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable date strip — hide native scrollbar everywhere */}
        <div
          ref={scrollContainerRef}
          className="flex flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth py-1 px-0.5"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {datesList.map((item) => {
            const isSelected = item.dateStr === selectedDate
            const eventCount = eventDatesMap[item.dateStr] || 0
            const hasEvents = eventCount > 0

            return (
              <button
                key={item.dateStr}
                data-date={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                style={{ scrollSnapAlign: 'center' }}
                className={cn(
                  'relative shrink-0 flex flex-col items-center justify-center w-[4.5rem] md:w-20 py-2.5 rounded-2xl border transition-all duration-200 select-none',
                  isSelected
                    ? 'bg-gradient-to-b from-primary/95 to-primary text-on-primary border-primary scale-105 z-10 shadow-lg shadow-black/40'
                    : 'bg-surface-container-high/60 hover:bg-surface-container-highest/80 text-on-surface border-outline-variant/50 backdrop-blur-md',
                  !isSelected &&
                    hasEvents &&
                    'border-primary/30 shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
                )}
              >
                {/* Day name */}
                <span
                  className={cn(
                    'text-[11px] font-mono uppercase tracking-wider',
                    isSelected
                      ? 'text-on-primary/90 font-bold'
                      : item.isWeekend
                        ? 'text-secondary font-semibold'
                        : 'text-on-surface-variant',
                  )}
                >
                  {item.isToday ? 'Today' : item.dayName}
                </span>

                {/* Day number */}
                <span
                  className={cn(
                    'text-xl md:text-2xl font-display font-extrabold leading-none my-1',
                    isSelected ? 'text-on-primary' : 'text-on-surface',
                  )}
                >
                  {item.dayNumber}
                </span>

                {/* Month label */}
                <span
                  className={cn(
                    'text-[10px] font-mono uppercase',
                    isSelected ? 'text-on-primary/80 font-medium' : 'text-on-surface-variant/70',
                  )}
                >
                  {item.monthName}
                </span>

                {/* Event indicator badge / dots */}
                {hasEvents && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    {eventCount >= 3 ? (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-mono text-[9px] font-bold shadow-md animate-pulse">
                        <Flame className="w-2.5 h-2.5" />
                        {eventCount}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold',
                          isSelected
                            ? 'bg-on-primary text-primary'
                            : 'bg-primary text-on-primary shadow-sm',
                        )}
                      >
                        {eventCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Right Arrow — always visible on desktop */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll dates right"
          className="hidden md:flex shrink-0 w-9 h-9 rounded-2xl bg-surface-container-high/80 hover:bg-surface-container-highest border border-outline-variant/60 hover:border-primary/40 text-on-surface-variant hover:text-primary items-center justify-center shadow-md transition-all duration-200 active:scale-95 backdrop-blur-md"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Full Month Modal */}
      <MiniCalendarModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        eventDatesMap={eventDatesMap}
      />
    </div>
  )
}
