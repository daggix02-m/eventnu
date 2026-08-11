'use client'

import { getOrganizers } from '@/lib/actions/organizers'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedOrganizer } from '@/lib/mappers'

export const organizersKeys = ['organizers'] as const

export interface OrganizerListFilters {
  verified?: string
  search?: string
}

export function useOrganizers(
  filters: OrganizerListFilters,
  initial: CursorPage<MappedOrganizer>,
  initialFilters: OrganizerListFilters,
) {
  const verified =
    filters.verified === 'true' ? true : filters.verified === 'false' ? false : undefined

  return useCursorPaginatedList<MappedOrganizer, OrganizerListFilters>({
    queryKey: organizersKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) => getOrganizers({ search: filters.search, verified, cursor }),
  })
}
