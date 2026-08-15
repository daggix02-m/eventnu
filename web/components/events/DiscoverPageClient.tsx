'use client'

import { useState, useMemo } from 'react'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { EventList } from '@/components/events/EventList'
import { CategoryEventShelf } from '@/components/events/CategoryEventShelf'
import { PulseEqualizer } from '@/components/events/PulseEqualizer'
import { SearchBar, CategoryPills, DateFilter } from '@/components/events/SearchBar'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import type { Event, Category } from '@/types'

interface DiscoverPageClientProps {
  events: Event[]
  categories: Category[]
  initialSearch?: string
  initialCategory?: string
  initialDate?: string
}

function matchesDateFilter(eventDate: Date, filter: string): boolean {
  const now = new Date()
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  switch (filter) {
    case 'upcoming':
      return eventDate >= now
    case 'past':
      return eventDate < now
    case 'today':
      return eventDay.getTime() === today.getTime()
    case 'tomorrow':
      return eventDay.getTime() === tomorrow.getTime()
    case 'weekend': {
      const day = eventDate.getDay()
      return day === 0 || day === 6
    }
    case 'week': {
      const endOfWeek = new Date(today)
      endOfWeek.setDate(today.getDate() + 7)
      return eventDate >= today && eventDate < endOfWeek
    }
    case 'month': {
      return (
        eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()
      )
    }
    default:
      return true
  }
}

export function DiscoverPageClient({
  events,
  categories,
  initialSearch = '',
  initialCategory,
  initialDate = 'all',
}: DiscoverPageClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory)
  const [dateFilter, setDateFilter] = useState(initialDate)
  const [viewMode, setViewMode] = useState<'categorized' | 'grid'>('categorized')

  const headingRef = useScrollReveal({ y: 20, duration: 0.6 })
  const filtersRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.1 })
  const gridRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.15 })

  // All events sorted and filtered by date
  const dateFilteredEvents = useMemo(() => {
    const now = Date.now()
    return events
      .filter((event) => matchesDateFilter(new Date(event.start_date), dateFilter))
      .sort((a, b) => {
        const aTime = new Date(a.start_date).getTime()
        const bTime = new Date(b.start_date).getTime()
        const aUpcoming = aTime >= now
        const bUpcoming = bTime >= now
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        return aUpcoming ? aTime - bTime : bTime - aTime
      })
  }, [events, dateFilter])

  // Filtered events when searching or selecting a specific category
  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase().trim()
    return dateFilteredEvents.filter((event) => {
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.venue_name?.toLowerCase().includes(term) ||
        event.venue_address?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term)

      const primaryCategory =
        event.event_categories?.find((ec) => ec.is_primary)?.categories ??
        event.event_categories?.[0]?.categories
      const matchesCategory = !activeCategory || primaryCategory?.slug === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [dateFilteredEvents, search, activeCategory])

  // Group events by categories for horizontal scrolling shelves
  const categorizedShelves = useMemo(() => {
    if (activeCategory || search.trim()) return []

    // Grouping
    const shelves: { category: Category; events: Event[] }[] = []

    categories.forEach((cat) => {
      const catEvents = dateFilteredEvents.filter((event) => {
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
  }, [dateFilteredEvents, categories, activeCategory, search])

  const isCategorizedView =
    viewMode === 'categorized' && !activeCategory && !search.trim() && categorizedShelves.length > 0

  return (
    <>
      <Container className="py-xl space-y-xl" id="event-grid">
        {/* Page Header */}
        <div ref={headingRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <h2 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
              Discover <span className="text-primary">events</span>
            </h2>
            <PulseEqualizer className="hidden sm:flex" barCount={5} />
          </div>

          <div className="flex items-center gap-sm self-start sm:self-auto">
            {/* View Mode Toggle (Categorized Shelves vs Grid) */}
            {!activeCategory && !search.trim() && (
              <div className="flex items-center p-1 bg-surface-container-low border border-outline-variant rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('categorized')}
                  aria-pressed={viewMode === 'categorized'}
                  aria-label="Categorized Shelves View"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    viewMode === 'categorized'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  <span>Shelves</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Grid View"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    viewMode === 'grid'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface',
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>
            )}

            <p className="text-on-surface-variant font-mono text-label-sm">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div ref={filtersRef} className="flex flex-col md:flex-row gap-md">
          <div className="md:w-1/3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search events..." />
          </div>
          <div className="md:w-2/3 flex flex-col gap-sm sticky top-16 z-30 -mx-gutter px-gutter py-sm bg-background/90 backdrop-blur-md border-b border-outline-variant/60 md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:backdrop-blur-none md:border-0">
            <CategoryPills
              categories={categories}
              activeSlug={activeCategory}
              onSelect={setActiveCategory}
            />
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        {/* Content Area: Horizontal Categorized Shelves OR Filtered Grid */}
        <div ref={gridRef} className="space-y-xl">
          {isCategorizedView ? (
            <div className="space-y-xl">
              {/* Featured / Trending Shelf */}
              {dateFilteredEvents.length > 0 && (
                <CategoryEventShelf
                  category={{
                    slug: 'trending',
                    name: '🔥 Trending & Upcoming',
                  }}
                  events={dateFilteredEvents.slice(0, 8)}
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
