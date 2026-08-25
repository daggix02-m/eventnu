'use client'

import { useCallback, useMemo } from 'react'
import { useMutation } from 'convex/react'

/**
 * The optimistic-update body for a like/bookmark toggle, extracted as a pure
 * function so it can be unit-tested against a fake `OptimisticLocalStore`.
 *
 * Convex's `OptimisticLocalStore` is value-based: `setQuery(query, args, value)`
 * stores a VALUE (a function passed as `value` would be stored literally and
 * corrupt the query result). Direction is derived once from the pre-mutation
 * `wasLiked` read at the top, so a like always increments the count and an
 * unlike always decrements it.
 */
export function applyOptimisticToggle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  localStore: any,
  args: { eventId: string },
  deps: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulkQuery: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countQuery: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    feedQueries?: any[]
  },
) {
  const { eventId: eid } = args
  const { query, bulkQuery, countQuery, feedQueries = [] } = deps

  // Pre-mutation state — source of truth for direction. Read before any setQuery.
  const wasLiked = localStore.getQuery(query, { eventId: eid })
  const delta = wasLiked ? -1 : 1

  // 1. Single-event query (hasLiked / hasBookmarked): flip it.
  if (wasLiked !== undefined) {
    localStore.setQuery(query, { eventId: eid }, !wasLiked)
  }

  // 2. Bulk query (hasLikedBulk / hasBookmarkedBulk): toggle the entry.
  const bulk = localStore.getQuery(bulkQuery, { eventIds: [eid] })
  if (bulk !== undefined) {
    const next = { ...bulk }
    if (wasLiked) {
      delete next[eid]
    } else {
      next[eid] = true
    }
    localStore.setQuery(bulkQuery, { eventIds: [eid] }, next)
  }

  // 3. Count query (countByEvent): adjust the badge by the direction.
  const count = localStore.getQuery(countQuery, { eventId: eid })
  if (count !== undefined) {
    localStore.setQuery(countQuery, { eventId: eid }, Math.max(0, count + delta))
  }

  // 4. Feed queries (getPublished, getFeatured, etc.): patch likeCount in place.
  for (const feedQuery of feedQueries) {
    for (const instance of localStore.getAllQueries(feedQuery)) {
      if (!Array.isArray(instance.value)) continue
      const next = instance.value.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ev: any) =>
          ev._id === eid ? { ...ev, likeCount: Math.max(0, (ev.likeCount ?? 0) + delta) } : ev,
      )
      localStore.setQuery(feedQuery, instance.args, next)
    }
  }
}

/**
 * Optimistic toggle hook for like/bookmark actions.
 *
 * Flips the UI instantly on tap (no spinner), reconciles with the server
 * response in the background. If the mutation fails, Convex automatically
 * rolls back the optimistic patch so the UI reverts to the pre-tap state.
 *
 * Returns `(current: boolean) => Promise<void>` — call with the current
 * liked/saved state to flip it.
 */
export function useOptimisticToggle({
  eventId,
  query,
  bulkQuery,
  countQuery,
  mutation,
  feedQueries = [],
}: {
  eventId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulkQuery: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countQuery: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: any
  /** Feed queries whose results are `PublicEvent[]` with a `likeCount` field. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedQueries?: any[]
}) {
  const baseMutation = useMutation(mutation)

  const toggle = useMemo(
    () =>
      baseMutation.withOptimisticUpdate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (localStore: any, args: { eventId: string }) =>
          applyOptimisticToggle(localStore, args, { query, bulkQuery, countQuery, feedQueries }),
      ),
    [baseMutation, query, bulkQuery, countQuery, feedQueries],
  )

  return useCallback((_current: boolean) => toggle({ eventId }), [toggle, eventId])
}
