'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Building2, LayoutGrid, Rows3 } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { EventList } from '@/components/events/cards/EventList'
import { CategoryEventShelf } from '@/components/home/CategoryEventShelf'
import { SearchBar } from '@/components/home/SearchBar'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'
import type { DiscoverEvent, Category } from '@/types'

interface DiscoverPageClientProps {
  events: DiscoverEvent[]
  categories: Category[]
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

export function DiscoverPageClient({ events, categories }: DiscoverPageClientProps) {
  const searchParams = useSearchParams()
  // Hydration safety: this page is force-static + ISR, so the baked HTML was
  // rendered with empty URL params. If we read `useSearchParams()` into initial
  // state, a client landing on `/?category=X` (the /discover redirect target)
  // would render a different tree than the server on the first client pass and
  // trigger React #418. Keep the server baseline (empty) for the first render
  // and apply the real params only after mount.
  const [hydrated, setHydrated] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<EventStatus>('all')
  const [viewMode, setViewMode] = useState<'categorized' | 'organizer' | 'grid'>('categorized')

  useEffect(() => {
    setSearch(searchParams.get('q') ?? '')
    setActiveCategory(searchParams.get('category') ?? undefined)
    setStatus(toStatus(searchParams.get('date') ?? 'all'))
    setHydrated(true)
  }, [searchParams])

  const searchRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.1 })
  const gridRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.15 })

  // All events sorted and filtered by status
  const statusFilteredEvents = useMemo(() => {
    // `Date.now()` differs between the ISR bake and the user's hydration pass,
    // so the upcoming/ended boundary (and thus the sort order) must not drive
    // the first render. Use a stable start-date sort until hydrated.
    const now = hydrated ? Date.now() : Number.POSITIVE_INFINITY
    return events
      .filter((event) => matchesStatus(new Date(event.start_date), status))
      .sort((a, b) => {
        const aTime = new Date(a.start_date).getTime()
        const bTime = new Date(b.start_date).getTime()
        if (!hydrated) return aTime - bTime
        const aUpcoming = aTime >= now
        const bUpcoming = bTime >= now
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        return aUpcoming ? aTime - bTime : bTime - aTime
      })
  }, [events, status, hydrated])

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
    const shelves: { category: Category; events: DiscoverEvent[] }[] = []

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
    const groups = new Map<string, { name: string; events: DiscoverEvent[] }>()
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
