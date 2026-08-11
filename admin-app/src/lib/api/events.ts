'use client'

import { getEvents } from '@/lib/actions/events'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedEvent } from '@/lib/mappers'

export const eventsKeys = ['events'] as const

export interface EventsListFilters {
  search?: string
  status?: string
  source?: string
  frequency?: string
  featured?: boolean
}

export function useEvents({
  filters,
  initial,
  initialFilters,
}: {
  filters: EventsListFilters
  initial: CursorPage<MappedEvent>
  initialFilters: EventsListFilters
}) {
  return useCursorPaginatedList<MappedEvent, EventsListFilters>({
    queryKey: eventsKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) =>
      getEvents({
        status: filters.status !== 'all' ? filters.status : undefined,
        source: filters.source !== 'all' ? filters.source : undefined,
        featured: filters.featured,
        frequency: filters.frequency !== 'all' ? filters.frequency : undefined,
        search: filters.search || undefined,
        cursor,
      }),
  })
}
