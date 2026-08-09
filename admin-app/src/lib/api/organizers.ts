'use client'

import { getOrganizers } from '@/lib/actions/organizers'
import { usePaginatedList } from './use-paginated-list'
import type { MappedOrganizer } from '@/lib/mappers'

export const organizersKeys = ['organizers'] as const

export interface OrganizerListFilters {
  verified?: string
  search?: string
  page?: number
}

export function useOrganizers(
  filters: OrganizerListFilters,
  initial: { organizers: MappedOrganizer[]; count: number },
  initialFilters: OrganizerListFilters,
) {
  const verified =
    filters.verified === 'true' ? true : filters.verified === 'false' ? false : undefined

  return usePaginatedList<MappedOrganizer, OrganizerListFilters>({
    queryKey: organizersKeys,
    filters,
    initialFilters,
    initial: initial
      ? { items: initial.organizers, total: initial.count, all: initial.organizers }
      : undefined,
    page: filters.page ?? 1,
    fetchAll: async () => {
      const { organizers } = await getOrganizers({ search: filters.search, verified })
      return organizers
    },
  })
}
