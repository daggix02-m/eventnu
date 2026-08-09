'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { paginate, DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export interface PageData<T> {
  items: T[]
  total: number
  /** The full filtered collection (for stats, before pagination). */
  all: T[]
}

function toPageData<T>(all: T[], page = 1, perPage = DEFAULT_PAGE_SIZE): PageData<T> {
  return { items: paginate(all, page, perPage), total: all.length, all }
}

interface UsePaginatedListOptions<T, F> {
  queryKey: readonly unknown[]
  filters: F
  initialFilters: F
  initial?: PageData<T>
  fetchAll: () => Promise<T[]>
  page?: number
  perPage?: number
}

/** Client-side pagination over a server action that returns the full collection. */
export function usePaginatedList<T, F>({
  queryKey,
  filters,
  initialFilters,
  initial,
  fetchAll,
  page = 1,
  perPage = DEFAULT_PAGE_SIZE,
}: UsePaginatedListOptions<T, F>) {
  const matchesInitial = JSON.stringify(filters) === JSON.stringify(initialFilters)

  return useQuery<PageData<T>>({
    queryKey: [...queryKey, filters],
    queryFn: async () => toPageData(await fetchAll(), page, perPage),
    initialData: matchesInitial && initial ? initial : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
