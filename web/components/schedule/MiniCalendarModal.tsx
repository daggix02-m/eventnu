'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toDateString } from '@/lib/dates'

interface MiniCalendarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void
  eventDatesMap: Record<string, number> // 'YYYY-MM-DD' -> count
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MiniCalendarModal({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  eventDatesMap,
}: MiniCalendarModalProps) {
  const initialDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date()
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth())

  const todayStr = toDateString(new Date())

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const handleJumpToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    onSelectDate(todayStr)
    onOpenChange(false)
  }

  // Days in month calculation
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const calendarCells = []

  // Preceding month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const dateStr = toDateString(new Date(prevYear, prevMonthIdx, dayNum))
    calendarCells.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
      eventCount: eventDatesMap[dateStr] || 0,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateString(new Date(currentYear, currentMonth, d))
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      eventCount: eventDatesMap[dateStr] || 0,
    })
  }

  // Next month leading days to complete the 35 or 42 grid
  const remainingCells = (7 - (calendarCells.length % 7)) % 7
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    const dateStr = toDateString(new Date(nextYear, nextMonthIdx, d))
    calendarCells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      eventCount: eventDatesMap[dateStr] || 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[28rem] bg-surface-container-low/95 backdrop-blur-2xl border-outline-variant/60 shadow-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold text-on-surface">City Calendar</DialogTitle>
            </div>
            <button
              onClick={handleJumpToToday}
              className="text-xs font-mono text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded bg-primary/10 border border-primary/20"
            >
              Today
            </button>
          </div>
          <DialogDescription className="text-xs text-on-surface-variant">
            Select any date to view scheduled events in Addis Ababa.
          </DialogDescription>
        </DialogHeader>

        {/* Month Navigation */}
        <div className="flex items-center justify-between py-2 border-y border-outline-variant/40">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-semibold text-base text-on-surface">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-on-surface-variant/70 uppercase">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell) => {
            const isSelected = cell.dateStr === selectedDate
            const isToday = cell.dateStr === todayStr
            const hasEvents = cell.eventCount > 0

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(cell.dateStr)
                  onOpenChange(false)
                }}
                className={cn(
                  'relative h-11 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all duration-200 group',
                  cell.isCurrentMonth
                    ? 'text-on-surface'
                    : 'text-on-surface-variant/30 hover:text-on-surface-variant/60',
                  isSelected && 'bg-primary text-on-primary font-bold scale-105 z-10 shadow-md',
                  !isSelected &&
                    hasEvents &&
                    'bg-surface-container-high/80 hover:bg-surface-container-highest border border-outline-variant/60',
                  !isSelected && !hasEvents && 'hover:bg-surface-container-high/40',
                  isToday && !isSelected && 'border-2 border-primary/50 text-primary font-semibold',
                )}
              >
                <span>{cell.dayNum}</span>

                {/* Event indicator dots / fire */}
                {hasEvents && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {cell.eventCount >= 3 ? (
                      <span
                        className={cn(
                          'text-[9px] font-mono leading-none',
                          isSelected ? 'text-on-primary' : 'text-amber-400',
                        )}
                      >
                        🔥{cell.eventCount}
                      </span>
                    ) : (
                      Array.from({ length: Math.min(cell.eventCount, 2) }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isSelected ? 'bg-on-primary' : 'bg-primary',
                          )}
                        />
                      ))
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant/70 pt-2 border-t border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Has Events</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🔥 3+ Events (Peak Night)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
