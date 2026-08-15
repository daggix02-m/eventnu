'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarPlus,
  Clock,
  MapPin,
  Sparkles,
  Check,
  ExternalLink,
  ChevronDown,
  Calendar as CalendarIcon,
  Download,
  Share2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  buildYahooCalendarUrl,
  buildIcs,
  downloadIcsFile,
} from '@/lib/calendar'
import { formatPrice, cn } from '@/lib/utils'
import { formatEventTime } from '@/lib/dates'
import type { Event } from '@/types'

interface ScheduleEventCardProps {
  event: Event
  isPlanned?: boolean
  onTogglePlan?: (event: Event) => void
  isHighlighted?: boolean
}

function formatTime(isoString: string, timeZone?: string): string {
  return formatEventTime(isoString, timeZone)
}

function getEventStatus(
  startDateStr: string,
  endDateStr: string | null | undefined,
  timeZone?: string,
): { label: string; isLive: boolean; isSoon: boolean; isPast: boolean } {
  const now = new Date().getTime()
  const start = new Date(startDateStr).getTime()
  const end = endDateStr ? new Date(endDateStr).getTime() : start + 3 * 60 * 60 * 1000 // default 3h

  if (now > end) {
    return { label: 'ENDED', isLive: false, isSoon: false, isPast: true }
  }
  if (now >= start && now <= end) {
    return { label: '🔴 LIVE NOW', isLive: true, isSoon: false, isPast: false }
  }
  const diffHours = (start - now) / (1000 * 60 * 60)
  if (diffHours > 0 && diffHours <= 3) {
    const mins = Math.round((start - now) / (1000 * 60))
    return {
      label: mins < 60 ? `IN ${mins} MINS` : `IN ${Math.round(diffHours)} HOURS`,
      isLive: false,
      isSoon: true,
      isPast: false,
    }
  }
  return { label: '', isLive: false, isSoon: false, isPast: false }
}

export function ScheduleEventCard({
  event,
  isPlanned = false,
  onTogglePlan,
  isHighlighted = false,
}: ScheduleEventCardProps) {
  const [downloaded, setDownloaded] = useState(false)
  const status = getEventStatus(event.start_date, event.end_date, event.timezone)
  const timeFormatted = formatTime(event.start_date, event.timezone)

  const handleDownloadIcs = () => {
    const icsContent = buildIcs(event)
    downloadIcsFile(`${event.slug || event.id}-event.ics`, icsContent)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  const primaryCategory = event.event_categories?.[0]?.categories?.name

  return (
    <div
      id={`event-card-${event.id}`}
      className={cn(
        'group relative flex flex-col md:flex-row items-stretch gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-300 backdrop-blur-xl w-full',
        isHighlighted
          ? 'bg-primary/10 border-primary ring-2 ring-primary/60 scale-[1.01] shadow-xl shadow-black/50'
          : 'bg-surface-container-high/60 hover:bg-surface-container-high/90 border-outline-variant/40 hover:border-outline-variant hover:shadow-xl hover:shadow-black/40',
      )}
    >
      {/* Time & Status Column (Left on Desktop, Top on Mobile) */}
      <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 md:w-32 shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/30 pb-3 md:pb-0 md:pr-4">
        <div className="flex items-center gap-1.5 font-mono text-base md:text-lg font-bold text-on-surface">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>{timeFormatted}</span>
        </div>

        {status.label && (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider',
              status.isLive && 'bg-error/20 text-error border border-error/30 animate-pulse',
              status.isSoon && 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
              status.isPast && 'bg-surface-container-highest text-on-surface-variant/70',
            )}
          >
            {status.label}
          </span>
        )}

        {primaryCategory && (
          <span className="hidden md:inline-block mt-auto text-[11px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
            {primaryCategory}
          </span>
        )}
      </div>

      {/* Poster Thumbnail */}
      <Link
        href={`/events/${event.slug || event.id}`}
        className="relative w-full md:w-32 h-44 md:h-auto md:aspect-square rounded-xl overflow-hidden bg-surface-container-highest shrink-0 group/img"
      >
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 150px"
            className="object-cover transition-transform duration-300 group-hover/img:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-highest text-on-surface-variant/40">
            <CalendarIcon className="w-8 h-8" />
          </div>
        )}
      </Link>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between min-w-0 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 md:hidden">
            {primaryCategory && (
              <span className="text-[11px] font-medium text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
                {primaryCategory}
              </span>
            )}
          </div>

          <Link href={`/events/${event.slug || event.id}`} className="block group/title">
            <h3 className="font-display text-lg md:text-xl font-bold text-on-surface group-hover/title:text-primary transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>

          {event.subtitle && (
            <p className="text-xs text-on-surface-variant line-clamp-1">{event.subtitle}</p>
          )}

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[200px]">{event.venue_name}</span>
            </div>
            <span className="text-outline-variant">•</span>
            <span className="font-semibold text-secondary">
              {formatPrice(event.price_display, event.is_free)}
            </span>
          </div>
        </div>

        {/* Interactive Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/30">
          {/* Plan Itinerary Checkbox */}
          {onTogglePlan && (
            <button
              type="button"
              onClick={() => onTogglePlan(event)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none border',
                isPlanned
                  ? 'bg-secondary/20 text-secondary border-secondary/50 font-semibold'
                  : 'bg-surface-container-highest/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border-outline-variant/40',
              )}
            >
              {isPlanned ? (
                <>
                  <Check className="w-3.5 h-3.5 text-secondary" />
                  <span>In Your Plan</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>+ Plan My Day</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {/* 1-Tap Add to Calendar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all duration-200"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Add to Calendar</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-surface-container-high/95 backdrop-blur-xl border-outline-variant/60"
              >
                <DropdownMenuLabel className="text-[11px] text-on-surface-variant font-mono">
                  Sync with your calendar
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Google Calendar */}
                <DropdownMenuItem asChild>
                  <a
                    href={buildGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Google Calendar</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </DropdownMenuItem>

                {/* Apple / iCal (.ics) */}
                <DropdownMenuItem
                  onClick={handleDownloadIcs}
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Apple / iCal (.ics)</span>
                  <Download className="w-3 h-3 ml-auto opacity-50" />
                </DropdownMenuItem>

                {/* Outlook */}
                <DropdownMenuItem asChild>
                  <a
                    href={buildOutlookCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Outlook 365</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </DropdownMenuItem>

                {/* Yahoo */}
                <DropdownMenuItem asChild>
                  <a
                    href={buildYahooCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    <span>Yahoo Calendar</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Event Link */}
            <Link
              href={`/events/${event.slug || event.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-highest hover:bg-surface-container text-on-surface border border-outline-variant/50 transition-colors"
            >
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
