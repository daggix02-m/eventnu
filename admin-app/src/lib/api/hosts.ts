'use client'

import { getHosts } from '@/lib/actions/hosts'
import { usePaginatedList } from './use-paginated-list'
import type { MappedHost } from '@/lib/mappers'

export const hostsKeys = ['hosts'] as const

export interface HostListFilters {
  status?: string
  type?: string
  search?: string
  page?: number
}

export function useHosts(
  filters: HostListFilters,
  initial: { hosts: MappedHost[]; count: number },
  initialFilters: HostListFilters,
) {
  return usePaginatedList<MappedHost, HostListFilters>({
    queryKey: hostsKeys,
    filters,
    initialFilters,
    initial: initial
      ? { items: initial.hosts, total: initial.count, all: initial.hosts }
      : undefined,
    page: filters.page ?? 1,
    fetchAll: async () => {
      const { hosts } = await getHosts({
        search: filters.search,
        status: filters.status,
        type: filters.type,
      })
      return hosts
    },
  })
}
