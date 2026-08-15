'use client'

import { Coffee, Flame, RotateCcw, CalendarDays } from 'lucide-react'

interface EmptyScheduleStateProps {
  onResetFilters: () => void
  onJumpToWeekend: () => void
  onJumpToNextDateWithEvents?: () => void
  hasNextEventDate?: boolean
}

export function EmptyScheduleState({
  onResetFilters,
  onJumpToWeekend,
  onJumpToNextDateWithEvents,
  hasNextEventDate = false,
}: EmptyScheduleStateProps) {
  return (
    <div className="w-full max-w-xl mx-auto my-8 flex flex-col items-center justify-center text-center p-6 sm:p-10 rounded-3xl bg-surface-container-high/60 border border-outline-variant/40 backdrop-blur-xl space-y-5 shadow-2xl shrink-0">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
        <Coffee className="w-8 h-8" />
      </div>

      <div className="space-y-2 w-full max-w-md mx-auto text-center">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-on-surface">
          Addis is taking a breather!
        </h3>
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          No events match this date or filter. Check out what&apos;s coming up this weekend or jump to the nearest active night.
        </p>
      </div>

      <div className="w-full flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {hasNextEventDate && onJumpToNextDateWithEvents && (
          <button
            type="button"
            onClick={onJumpToNextDateWithEvents}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all duration-200 shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Next Active Date</span>
          </button>
        )}

        <button
          type="button"
          onClick={onJumpToWeekend}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-highest hover:bg-surface-container text-on-surface border border-outline-variant/50 transition-all duration-200 shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>This Weekend</span>
        </button>

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  )
}
