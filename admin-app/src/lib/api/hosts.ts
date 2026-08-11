'use client'

import { getHosts } from '@/lib/actions/hosts'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedHost } from '@/lib/mappers'

export const hostsKeys = ['hosts'] as const

export interface HostListFilters {
  status?: string
  type?: string
  search?: string
}

export function useHosts(
  filters: HostListFilters,
  initial: CursorPage<MappedHost>,
  initialFilters: HostListFilters,
) {
  return useCursorPaginatedList<MappedHost, HostListFilters>({
    queryKey: hostsKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) =>
      getHosts({
        search: filters.search,
        status: filters.status,
        type: filters.type,
        cursor,
      }),
  })
}
