'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getEvents } from '@/lib/actions/events'
import type { MappedEvent } from '@/lib/mappers'

export const eventsKeys = ['events'] as const

export interface EventsListFilters {
  search?: string
  status?: string
  source?: string
  frequency?: string
  featured?: boolean
  page?: number
}

export interface EventsPageData {
  events: MappedEvent[]
  count: number
}

export function useEvents({
  filters,
  initialEvents,
  initialCount,
  initialFilters,
}: {
  filters: EventsListFilters
  initialEvents: MappedEvent[]
  initialCount: number
  initialFilters: EventsListFilters
}) {
  const matchesInitial = JSON.stringify(filters) === JSON.stringify(initialFilters)
  return useQuery<EventsPageData>({
    queryKey: [...eventsKeys, filters],
    queryFn: () =>
      getEvents({
        status: filters.status !== 'all' ? filters.status : undefined,
        source: filters.source !== 'all' ? filters.source : undefined,
        featured: filters.featured,
        frequency: filters.frequency !== 'all' ? filters.frequency : undefined,
        search: filters.search || undefined,
        page: filters.page ?? 1,
        perPage: 20,
      }),
    initialData: matchesInitial ? { events: initialEvents, count: initialCount } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
