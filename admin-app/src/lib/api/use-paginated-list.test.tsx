import { describe, expect, it, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCursorPaginatedList, type CursorPage } from './use-paginated-list'

function makePage(n: number, total = 4): CursorPage<{ id: number }> {
  const isDone = n >= total
  return {
    items: [{ id: n }],
    nextCursor: isDone ? null : `cursor-${n + 1}`,
    isDone,
  }
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCursorPaginatedList', () => {
  it('fetches the first page and exposes next/prev state', async () => {
    const queryClient = new QueryClient()
    const queryFn = vi.fn(async (cursor: string | null) => makePage(cursor ? 2 : 1))

    const { result } = renderHook(
      () =>
        useCursorPaginatedList({
          queryKey: ['events'],
          filters: {},
          initialFilters: {},
          queryFn,
        }),
      { wrapper: wrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.pageIndex).toBe(1)
    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(true)
    expect(queryFn).toHaveBeenCalledWith(null)
  })

  it('goes forward and backward through pages without refetching on back', async () => {
    const queryClient = new QueryClient()
    const queryFn = vi.fn(async (cursor: string | null) => makePage(cursor === 'cursor-2' ? 2 : 1))

    const { result } = renderHook(
      () =>
        useCursorPaginatedList({
          queryKey: ['events'],
          filters: {},
          initialFilters: {},
          initial: makePage(1),
          queryFn,
        }),
      { wrapper: wrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())

    act(() => result.current.next())
    await waitFor(() => expect(result.current.pageIndex).toBe(2))
    expect(queryFn).toHaveBeenCalledWith('cursor-2')
    expect(result.current.hasPrev).toBe(true)

    const fetchCountAfterForward = queryFn.mock.calls.length
    act(() => result.current.prev())
    await waitFor(() => expect(result.current.pageIndex).toBe(1))
    // Back navigation must reuse the cached page, not refetch.
    expect(queryFn.mock.calls.length).toBe(fetchCountAfterForward)
  })

  it('does not push the same cursor twice on rapid double-click', async () => {
    const queryClient = new QueryClient()
    const queryFn = vi.fn(async (cursor: string | null) => makePage(cursor ? 2 : 1))

    const { result } = renderHook(
      () =>
        useCursorPaginatedList({
          queryKey: ['events'],
          filters: {},
          initialFilters: {},
          initial: makePage(1),
          queryFn,
        }),
      { wrapper: wrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())

    act(() => {
      result.current.next()
      result.current.next()
      result.current.next()
    })

    // Three rapid clicks must only advance one page.
    expect(result.current.pageIndex).toBe(2)
    expect(result.current.hasPrev).toBe(true)
  })

  it('resets the cursor stack when filters change', async () => {
    const queryClient = new QueryClient()
    const queryFn = vi.fn(async (cursor: string | null) => makePage(cursor ? 2 : 1))

    const { result, rerender } = renderHook(
      ({ filters }: { filters: Record<string, string> }) =>
        useCursorPaginatedList({
          queryKey: ['events'],
          filters,
          initialFilters: {},
          initial: makePage(1),
          queryFn,
        }),
      {
        wrapper: wrapper(queryClient),
        initialProps: { filters: {} },
      },
    )

    await waitFor(() => expect(result.current.data).toBeDefined())
    act(() => result.current.next())
    await waitFor(() => expect(result.current.pageIndex).toBe(2))

    rerender({ filters: { search: 'new' } })
    await waitFor(() => expect(result.current.pageIndex).toBe(1))
    expect(result.current.hasPrev).toBe(false)
  })
})
