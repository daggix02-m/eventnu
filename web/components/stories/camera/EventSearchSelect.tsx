'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventSearchSelectProps {
  value: string
  onChange: (eventId: string) => void
  className?: string
  placeholder?: string
}

/**
 * Searchable event combobox with dropdown.
 * Shows a text input for searching events by title,
 * with a dropdown list of matching results.
 */
export function EventSearchSelect({
  value,
  onChange,
  className,
  placeholder = 'Search events...',
}: EventSearchSelectProps) {
  const events = useQuery(api.events.read.getPublished)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Find the currently selected event title for display
  const selectedEvent = useMemo(() => {
    if (!events || !value) return null
    return events.find((e) => (e._id as string) === value) ?? null
  }, [events, value])

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!events) return []
    if (!query.trim()) return events.slice(0, 20) // Show first 20 when no query
    const lower = query.toLowerCase()
    return events.filter((e) => e.title.toLowerCase().includes(lower)).slice(0, 20)
  }, [events, query])

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(-1)
  }, [filteredEvents.length])

  const handleSelect = useCallback(
    (eventId: string) => {
      onChange(eventId === value ? '' : eventId) // Toggle off if same
      setQuery('')
      setIsOpen(false)
      inputRef.current?.blur()
    },
    [onChange, value],
  )

  const handleClear = useCallback(() => {
    onChange('')
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightIndex((i) => Math.min(i + 1, filteredEvents.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightIndex((i) => Math.max(i - 1, -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightIndex >= 0 && highlightIndex < filteredEvents.length) {
            handleSelect(filteredEvents[highlightIndex]._id as string)
          }
          break
        case 'Escape':
          setIsOpen(false)
          setQuery('')
          inputRef.current?.blur()
          break
      }
    },
    [isOpen, highlightIndex, filteredEvents, handleSelect],
  )

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[role="option"]')
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex])

  return (
    <div className={cn('relative', className)}>
      {/* Display button when closed and something is selected */}
      {selectedEvent && !isOpen ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            setQuery('')
          }}
          className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-left font-body-md text-white transition-colors hover:bg-white/20"
        >
          <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
          <span className="flex-1 truncate">{selectedEvent.title}</span>
          <X
            className="h-4 w-4 shrink-0 text-white/50 hover:text-white"
            aria-hidden="true"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
          />
        </button>
      ) : (
        /* Search input when open or nothing selected */
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border bg-white/10 px-4 py-3 transition-colors',
            isOpen ? 'border-primary ring-2 ring-primary/40' : 'border-white/20 hover:bg-white/20',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-white/50" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedEvent ? selectedEvent.title : placeholder}
            aria-label="Search events"
            aria-autocomplete="list"
            aria-controls="event-listbox"
            className="flex-1 bg-transparent font-body-md text-white placeholder:text-white/50 focus:outline-none"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear selection"
              className="text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown
            className={cn('h-4 w-4 text-white/50 transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          id="event-listbox"
          role="listbox"
          aria-label="Events"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-white/20 bg-surface-container-high shadow-2xl scrollbar-hide"
        >
          {/* "No event" option */}
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect('')}
            className={cn(
              'flex w-full items-center px-4 py-3 text-left font-body-md transition-colors',
              !value
                ? 'bg-primary/20 text-primary'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            No specific event
          </button>

          {filteredEvents.length === 0 ? (
            <div className="px-4 py-3 text-center font-body-sm text-white/40">
              {events === undefined ? 'Loading events...' : 'No events found'}
            </div>
          ) : (
            filteredEvents.map((event, i) => {
              const isSelected = value === (event._id as string)
              const isHighlighted = i === highlightIndex
              return (
                <button
                  key={event._id as string}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(event._id as string)}
                  className={cn(
                    'flex w-full flex-col px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'bg-primary/20 text-primary'
                      : isHighlighted
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <span className="font-body-md truncate">{event.title}</span>
                  <span className="font-body-sm text-white/40">
                    {new Date(event.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setQuery('')
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
