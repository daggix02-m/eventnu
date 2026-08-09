'use client'

import { useState, useEffect, useCallback } from 'react'

export type FilterValue = string | number | boolean | undefined

export interface UseListFiltersOptions<T extends object> {
  basePath: string
  initial: T
  /** Values treated as "unset" — omitted from the URL (e.g. `all` for status). */
  defaults?: Partial<T>
  searchKey?: keyof T
}

export function useListFilters<T extends object>({
  basePath,
  initial,
  defaults,
  searchKey = 'search' as keyof T,
}: UseListFiltersOptions<T>) {
  const [filters, setFilters] = useState<T>(initial)
  const [searchInput, setSearchInput] = useState<string>(
    typeof initial[searchKey] === 'string' ? (initial[searchKey] as string) : '',
  )

  useEffect(() => {
    setFilters(initial)
  }, [initial])

  useEffect(() => {
    const current = filters[searchKey]
    if (searchInput === (current ?? '')) return
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, [searchKey]: searchInput || undefined, page: 1 } as T))
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, filters, searchKey])

  useEffect(() => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined) continue
      if (defaults?.[key as keyof T] === value) continue
      params.set(key, String(value))
    }
    const qs = params.toString()
    history.replaceState(null, '', `${basePath}${qs ? `?${qs}` : ''}`)
  }, [filters, basePath, defaults])

  const update = useCallback((key: keyof T, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'page' ? {} : { page: 1 }) } as T))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page } as T))
  }, [])

  return { filters, update, setPage, searchInput, setSearchInput }
}
