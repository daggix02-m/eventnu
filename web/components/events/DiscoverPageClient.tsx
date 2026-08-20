'use client'

import { useState, useMemo } from 'react'
import { Building2, LayoutGrid, Rows3 } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { EventList } from '@/components/events/EventList'
import { CategoryEventShelf } from '@/components/events/CategoryEventShelf'
import { SearchBar } from '@/components/events/SearchBar'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'
import type { Event, Category } from '@/types'

interface DiscoverPageClientProps {
  events: Event[]
  categories: Category[]
  initialSearch?: string
  initialCategory?: string
  initialStatus?: string
}

type EventStatus = 'all' | 'upcoming' | 'ended'

function toStatus(value: string | undefined): EventStatus {
  if (value === 'upcoming') return 'upcoming'
  if (value === 'past' || value === 'ended') return 'ended'
  return 'all'
}

function matchesStatus(eventDate: Date, status: EventStatus): boolean {
  if (status === 'all') return true
  const now = new Date()
  return status === 'upcoming' ? eventDate >= now : eventDate < now
}

export function DiscoverPageClient({
  events,
  categories,
  initialSearch = '',
  initialCategory,
  initialStatus,
}: DiscoverPageClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory)
  const [status, setStatus] = useState<EventStatus>(() => toStatus(initialStatus))
  const [viewMode, setViewMode] = useState<'categorized' | 'organizer' | 'grid'>('categorized')

  const searchRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.1 })
  const gridRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.15 })

  // All events sorted and filtered by status
  const statusFilteredEvents = useMemo(() => {
    const now = Date.now()
    return events
      .filter((event) => matchesStatus(new Date(event.start_date), status))
      .sort((a, b) => {
        const aTime = new Date(a.start_date).getTime()
        const bTime = new Date(b.start_date).getTime()
        const aUpcoming = aTime >= now
        const bUpcoming = bTime >= now
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        return aUpcoming ? aTime - bTime : bTime - aTime
      })
  }, [events, status])

  // Filtered events when searching or selecting a specific category
  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase().trim()
    return statusFilteredEvents.filter((event) => {
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.venue_name?.toLowerCase().includes(term) ||
        event.venue_address?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.organizer?.full_name?.toLowerCase().includes(term) ||
        event.organizer?.handle?.toLowerCase().includes(term)

      const primaryCategory =
        event.event_categories?.find((ec) => ec.is_primary)?.categories ??
        event.event_categories?.[0]?.categories
      const matchesCategory = !activeCategory || primaryCategory?.slug === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [statusFilteredEvents, search, activeCategory])

  // Group events by categories for horizontal scrolling shelves
  const categorizedShelves = useMemo(() => {
    if (activeCategory || search.trim()) return []

    // Grouping
    const shelves: { category: Category; events: Event[] }[] = []

    categories.forEach((cat) => {
      const catEvents = statusFilteredEvents.filter((event) => {
        const primaryCat =
          event.event_categories?.find((ec) => ec.is_primary)?.categories ??
          event.event_categories?.[0]?.categories
        return primaryCat?.slug === cat.slug || primaryCat?.id === cat.id
      })

      if (catEvents.length > 0) {
        shelves.push({
          category: cat,
          events: catEvents,
        })
      }
    })

    return shelves
  }, [statusFilteredEvents, categories, activeCategory, search])

  const organizerShelves = useMemo(() => {
    if (activeCategory || search.trim()) return []
    const groups = new Map<string, { name: string; events: Event[] }>()
    for (const event of statusFilteredEvents) {
      const key = event.organizer?.id ?? 'independent'
      const existing = groups.get(key)
      if (existing) {
        existing.events.push(event)
      } else {
        groups.set(key, {
          name: event.organizer?.full_name || 'Independent events',
          events: [event],
        })
      }
    }
    return [...groups.entries()]
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([id, group]) => ({
        category: { id, slug: `organizer-${id}`, name: group.name },
        events: group.events,
      }))
  }, [statusFilteredEvents, activeCategory, search])

  const isCategorizedView =
    viewMode === 'categorized' && !activeCategory && !search.trim() && categorizedShelves.length > 0
  const isOrganizerView =
    viewMode === 'organizer' && !activeCategory && !search.trim() && organizerShelves.length > 0

  return (
    <>
      <Container className="py-lg md:py-xl space-y-lg md:space-y-xl" id="event-grid">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <div className="flex flex-wrap items-center gap-sm self-start sm:self-auto">
            {/* View Mode Toggle (Categorized Shelves vs Grid) */}
            {!activeCategory && !search.trim() && (
              <SegmentedControl
                ariaLabel="View mode"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'categorized', label: 'Shelves', icon: Rows3 },
                  { value: 'organizer', label: 'Organizers', icon: Building2 },
                  { value: 'grid', label: 'Grid', icon: LayoutGrid },
                ]}
              />
            )}

            {/* Event Status Toggle (All / Upcoming / Ended) */}
            <SegmentedControl
              ariaLabel="Event status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ended', label: 'Ended' },
              ]}
            />

            <p className="text-on-surface-variant font-mono text-label-sm">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div ref={searchRef} className="md:w-1/3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search events..." />
        </div>

        {/* Content Area: Horizontal Categorized Shelves OR Filtered Grid */}
        <div ref={gridRef} className="space-y-xl">
          {isCategorizedView ? (
            <div className="space-y-xl">
              {/* Featured / Trending Shelf */}
              {status !== 'ended' && statusFilteredEvents.length > 0 && (
                <CategoryEventShelf
                  category={{
                    slug: 'trending',
                    name: 'Trending & Upcoming',
                  }}
                  events={statusFilteredEvents.slice(0, 8)}
                  priorityFirst
                />
              )}

              {/* Categorized Shelves */}
              {categorizedShelves.map(({ category, events: catEvents }) => (
                <CategoryEventShelf
                  key={category.id || category.slug}
                  category={category}
                  events={catEvents}
                  onSelectCategory={setActiveCategory}
                />
              ))}
            </div>
          ) : isOrganizerView ? (
            <div className="space-y-xl">
              {organizerShelves.map(({ category, events: organizerEvents }) => (
                <CategoryEventShelf
                  key={category.id}
                  category={category}
                  events={organizerEvents}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <p className="text-on-surface-variant font-mono text-label-sm">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                  {activeCategory && (
                    <span className="ml-2 text-primary font-semibold">
                      in {categories.find((c) => c.slug === activeCategory)?.name || activeCategory}
                    </span>
                  )}
                </p>
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory(undefined)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Clear category filter
                  </button>
                )}
              </div>
              <EventList
                events={filteredEvents}
                bento={!search.trim()}
                emptyMessage="No events match your search. Try adjusting your filters."
              />
            </div>
          )}
        </div>
      </Container>
    </>
  )
}
