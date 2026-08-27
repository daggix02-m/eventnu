'use client'

import { useState } from 'react'
import { CalendarCheck, Download, Trash2, Check, Sparkles } from 'lucide-react'
import { buildBatchIcs, downloadIcsFile } from '@/lib/calendar'
import { cn } from '@/lib/utils'
import type { DiscoverEvent } from '@/types'

interface ItineraryFloatingDockProps {
  plannedEvents: DiscoverEvent[]
  onClearPlan: () => void
  onRemoveItem?: (eventId: string) => void
}

export function ItineraryFloatingDock({ plannedEvents, onClearPlan }: ItineraryFloatingDockProps) {
  const [downloaded, setDownloaded] = useState(false)

  if (plannedEvents.length === 0) return null

  const handleExportBatchIcs = () => {
    const icsContent = buildBatchIcs(
      plannedEvents,
      `EventNu Itinerary (${plannedEvents.length} Events)`,
    )
    downloadIcsFile(`eventnu-my-plan-${new Date().toISOString().slice(0, 10)}.ics`, icsContent)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 3000)
  }

  return (
    <div className="fixed bottom-[calc(var(--keyboard-inset,0px)_+_9rem_+_env(safe-area-inset-bottom))] md:bottom-8 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto flex items-center justify-between gap-3 md:gap-6 w-full max-w-[32rem] bg-surface-container-low/95 backdrop-blur-2xl backdrop-saturate-150 border border-primary/40 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-4 py-2.5">
        {/* Left: Count info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-on-surface flex items-center gap-1.5 truncate">
              <span>
                {plannedEvents.length} {plannedEvents.length === 1 ? 'Event' : 'Events'} in Plan
              </span>
              <Sparkles className="w-3 h-3 text-secondary shrink-0 hidden sm:inline" />
            </p>
            <p className="text-[10px] text-on-surface-variant font-mono truncate">Ready to sync</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearPlan}
            className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            title="Clear Plan"
            aria-label="Clear Plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportBatchIcs}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-md',
              downloaded
                ? 'bg-secondary text-surface-container-lowest scale-95'
                : 'bg-primary text-on-primary hover:bg-primary/90 active:scale-95',
            )}
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Plan (.ics)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
