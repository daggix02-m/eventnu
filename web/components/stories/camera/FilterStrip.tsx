'use client'

import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Available filters matching the FILTER_STYLES in lib/media.ts.
 * Each filter has a label, CSS filter string, and a preview thumbnail tint.
 */
const FILTERS = [
  { id: null, label: 'None', css: 'none' },
  { id: 'vivid', label: 'Vivid', css: 'saturate(1.3) contrast(1.08)' },
  {
    id: 'warm',
    label: 'Warm',
    css: 'sepia(0.18) saturate(1.35) hue-rotate(-10deg) brightness(1.05)',
  },
  { id: 'cool', label: 'Cool', css: 'saturate(1.15) hue-rotate(10deg) brightness(1.02)' },
  { id: 'mono', label: 'Mono', css: 'grayscale(1) contrast(1.1)' },
] as const

export type FilterId = (typeof FILTERS)[number]['id']

interface FilterStripProps {
  value: FilterId
  onChange: (filter: FilterId) => void
  /** Optional preview image/video element to apply live filter to */
  previewRef?: React.RefObject<HTMLVideoElement | HTMLImageElement | null>
  className?: string
}

/**
 * Horizontal scrollable filter selector with live preview.
 * Renders small circular thumbnails for each filter with the CSS filter applied.
 * On mobile, scrolls horizontally; on desktop, fits within the container.
 */
export function FilterStrip({ value, onChange, previewRef, className }: FilterStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    dragStart.current = {
      x: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const dx = e.pageX - dragStart.current.x
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSelect = (filterId: FilterId) => {
    onChange(filterId)
    // Apply live preview to the video/image element if provided
    if (previewRef?.current) {
      const css = FILTERS.find((f) => f.id === filterId)?.css ?? 'none'
      previewRef.current.style.filter = css
    }
  }

  return (
    <div
      ref={scrollRef}
      role="radiogroup"
      aria-label="Photo filters"
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {FILTERS.map((filter) => {
        const isActive = value === filter.id
        return (
          <button
            key={filter.id ?? 'none'}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${filter.label} filter`}
            onClick={() => handleSelect(filter.id)}
            className={cn(
              'group flex flex-col items-center gap-1 shrink-0 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            {/* Filter preview circle */}
            <div
              className={cn(
                'relative h-14 w-14 rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                isActive
                  ? 'border-white scale-105 shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                  : 'border-white/20 opacity-70 hover:opacity-100 hover:border-white/40',
              )}
            >
              {/* Gradient background representing the filter tone */}
              <div className="absolute inset-0" style={{ filter: filter.css }}>
                {filter.id === null ? (
                  <div className="h-full w-full bg-gradient-to-br from-purple-400/40 via-pink-300/30 to-blue-400/40" />
                ) : filter.id === 'vivid' ? (
                  <div className="h-full w-full bg-gradient-to-br from-orange-400/50 via-pink-400/40 to-purple-400/50" />
                ) : filter.id === 'warm' ? (
                  <div className="h-full w-full bg-gradient-to-br from-amber-400/50 via-orange-300/40 to-red-300/40" />
                ) : filter.id === 'cool' ? (
                  <div className="h-full w-full bg-gradient-to-br from-cyan-400/50 via-blue-300/40 to-indigo-400/40" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-400/50 via-gray-300/40 to-gray-500/40" />
                )}
              </div>
              {/* Active checkmark */}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
            {/* Label */}
            <span
              className={cn(
                'text-[11px] font-medium transition-colors',
                isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80',
              )}
            >
              {filter.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
