'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

export interface CursorPage<T> {
  items: T[]
  nextCursor: string | null
  isDone: boolean
}

interface UseCursorPaginatedListOptions<T, F> {
  queryKey: readonly unknown[]
  filters: F
  initialFilters: F
  /** Server-rendered first page (cursor null), used as initialData. */
  initial?: CursorPage<T>
  queryFn: (cursor: string | null) => Promise<CursorPage<T>>
}

/**
 * Server-side cursor pagination backed by TanStack Query. Cursor state lives in
 * a stack kept client-side: `stack.length` is the current page index and each
 * entry is the cursor that fetches the next page. Back = pop (query cache hit),
 * forward = push the current page's nextCursor. The cursor is part of the query
 * key, so navigating back reuses the cached page instead of refetching.
 */
export function useCursorPaginatedList<T, F>({
  queryKey,
  filters,
  initialFilters,
  initial,
  queryFn,
}: UseCursorPaginatedListOptions<T, F>) {
  const [cursors, setCursors] = useState<string[]>([])

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])
  const initialKey = useMemo(() => JSON.stringify(initialFilters), [initialFilters])
  const lastFiltersKey = useRef(filtersKey)

  useEffect(() => {
    if (lastFiltersKey.current !== filtersKey) {
      lastFiltersKey.current = filtersKey
      setCursors([])
    }
  }, [filtersKey])

  const cursor = cursors[cursors.length - 1] ?? null

  const query = useQuery<CursorPage<T>>({
    queryKey: [...queryKey, filters, cursor],
    queryFn: () => queryFn(cursor),
    initialData: filtersKey === initialKey && cursor === null && initial ? initial : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const data = query.data
  const hasNext = !!data && !data.isDone && !!data.nextCursor
  const hasPrev = cursors.length > 0
  const pageIndex = cursors.length + 1

  const next = useCallback(() => {
    setCursors((prev) => (data?.nextCursor ? [...prev, data.nextCursor] : prev))
  }, [data])

  const prev = useCallback(() => {
    setCursors((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))
  }, [])

  const reset = useCallback(() => setCursors([]), [])

  return { ...query, hasNext, hasPrev, next, prev, reset, pageIndex }
}
