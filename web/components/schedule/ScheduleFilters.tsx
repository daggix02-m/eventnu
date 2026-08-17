'use client'

import { Sun, Sunset, Moon, Dices, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

export type TimeOfDayFilter = 'all' | 'daylight' | 'golden' | 'midnight'

interface ScheduleFiltersProps {
  timeFilter: TimeOfDayFilter
  onTimeFilterChange: (filter: TimeOfDayFilter) => void
  selectedCategory: string | null
  onCategoryChange: (categorySlug: string | null) => void
  categories: Category[]
  onRollDice: () => void
  isRollingDice?: boolean
  eventsCountOnDate: number
}

const TIME_FILTERS: Array<{
  id: TimeOfDayFilter
  label: string
  icon: typeof Sun
  hint: string
}> = [
  { id: 'all', label: 'All Hours', icon: Layers, hint: 'Full Day' },
  { id: 'daylight', label: 'Daylight', icon: Sun, hint: 'Before 5 PM' },
  { id: 'golden', label: 'Golden Hour', icon: Sunset, hint: '5 PM – 9 PM' },
  { id: 'midnight', label: 'Late Night', icon: Moon, hint: '9 PM+' },
]

export function ScheduleFilters({
  timeFilter,
  onTimeFilterChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onRollDice,
  isRollingDice = false,
  eventsCountOnDate,
}: ScheduleFiltersProps) {
  const sortedCategories = [...categories]
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div className="space-y-3.5 w-full">
      {/* Time-of-Day Vibe Bar & Roll the Dice Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Time of Day Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-high/60 border border-outline-variant/40 backdrop-blur-md overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TIME_FILTERS.map((item) => {
            const Icon = item.icon
            const isActive = timeFilter === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTimeFilterChange(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 select-none',
                  isActive
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/60',
                )}
              >
                <Icon
                  className={cn('w-3.5 h-3.5', isActive ? 'text-on-primary' : 'text-primary')}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* 🎲 Roll the Dice / Surprise Me Button */}
        {eventsCountOnDate > 1 && (
          <button
            type="button"
            onClick={onRollDice}
            disabled={isRollingDice}
            className={cn(
              'group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all duration-300 select-none shadow-md',
              'bg-gradient-to-r from-secondary/90 via-primary/90 to-tertiary/90 text-surface-container-lowest',
              'hover:scale-105 active:scale-95 hover:shadow-lg',
              isRollingDice && 'animate-pulse opacity-80 cursor-wait',
            )}
          >
            <Dices
              className={cn(
                'w-4 h-4 transition-transform duration-300',
                isRollingDice ? 'animate-spin' : 'group-hover:rotate-45',
              )}
            />
            <span>{isRollingDice ? 'Rolling...' : 'Surprise Me 🎲'}</span>
          </button>
        )}
      </div>

      {/* Category Pills Scroller */}
      {sortedCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
              selectedCategory === null
                ? 'bg-surface-container-highest text-on-surface font-semibold border border-primary/50'
                : 'bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30',
            )}
          >
            All Vibes
          </button>
          {sortedCategories.map((cat) => {
            const isCatActive = selectedCategory === cat.slug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(isCatActive ? null : cat.slug)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
                  isCatActive
                    ? 'bg-primary/20 text-primary font-semibold border border-primary/50'
                    : 'bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30',
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
