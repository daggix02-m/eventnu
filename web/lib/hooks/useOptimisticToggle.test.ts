import { describe, expect, it, vi } from 'vitest'
import { applyOptimisticToggle } from './useOptimisticToggle'

/**
 * A minimal fake of Convex's OptimisticLocalStore.
 *
 * Mirrors the real semantics: query results are keyed by (query, serialized
 * args), `getQuery` reads the current value, and `setQuery` stores a VALUE
 * (never a function). `getAllQueries` returns every instance of a query name.
 */
function makeStore() {
  // Token -> value keyed by `serializePathAndArgs(name, args)`.
  const map = new Map<string, unknown>()
  const serialize = (name: unknown, args: Record<string, unknown>) => {
    const path = typeof name === 'string' ? name : (name as { path?: string })?.path
    return `${path}:${JSON.stringify(args)}`
  }
  const setQuery = vi.fn((name: unknown, args: Record<string, unknown>, value: unknown) => {
    map.set(serialize(name, args), value)
  })
  const store = {
    _map: map,
    setQuery,
    getQuery: vi.fn((name: unknown, args: Record<string, unknown>) =>
      map.get(serialize(name, args)),
    ),
    getAllQueries: vi.fn(() => [] as { args: Record<string, unknown>; value: unknown }[]),
  }
  return store
}

const QUERY = { path: 'likes.hasLiked' }
const BULK = { path: 'likes.hasLikedBulk' }
const COUNT = { path: 'likes.countByEvent' }
const FEED = { path: 'events.read.getPublished' }

const EID = 'events_abc'

function feedResult(count: number) {
  return [
    { _id: EID, likeCount: count, title: 'X' },
    { _id: 'events_other', likeCount: 3 },
  ]
}

describe('applyOptimisticToggle', () => {
  it('likes: flips single query, increments count, updates feed, adds to bulk map', () => {
    const store = makeStore()
    // Seed pre-mutation state: user has NOT liked; count is 5; feed shows 5.
    store._map.set(`likes.hasLiked:{"eventId":"${EID}"}`, false)
    store._map.set(`likes.hasLikedBulk:{"eventIds":["${EID}"]}`, {})
    store._map.set(`likes.countByEvent:{"eventId":"${EID}"}`, 5)
    store.getAllQueries.mockReturnValue([{ args: {}, value: feedResult(5) }])

    applyOptimisticToggle(
      store,
      { eventId: EID },
      {
        query: QUERY,
        bulkQuery: BULK,
        countQuery: COUNT,
        feedQueries: [FEED],
      },
    )

    // Single query flipped to true (value, not a function).
    expect(store.getQuery(QUERY.path, { eventId: EID })).toBe(true)
    // Count incremented.
    expect(store.getQuery(COUNT.path, { eventId: EID })).toBe(6)
    // Feed event likeCount incremented; other event untouched.
    const feed = store.getQuery(FEED.path, {}) as typeof feedResult
    expect(feed).toEqual([
      { _id: EID, likeCount: 6, title: 'X' },
      { _id: 'events_other', likeCount: 3 },
    ])
    // Bulk map gained the event.
    expect(store.getQuery(BULK.path, { eventIds: [EID] })).toEqual({ [EID]: true })
    // Every value written by setQuery is data, never a function.
    for (const call of store.setQuery.mock.calls) {
      expect(typeof call[2]).not.toBe('function')
    }
  })

  it('unlikes: flips single query, decrements count, decrements feed, removes from bulk map', () => {
    const store = makeStore()
    store._map.set(`likes.hasLiked:{"eventId":"${EID}"}`, true)
    store._map.set(`likes.hasLikedBulk:{"eventIds":["${EID}"]}`, { [EID]: true })
    store._map.set(`likes.countByEvent:{"eventId":"${EID}"}`, 5)
    store.getAllQueries.mockReturnValue([{ args: {}, value: feedResult(5) }])

    applyOptimisticToggle(
      store,
      { eventId: EID },
      {
        query: QUERY,
        bulkQuery: BULK,
        countQuery: COUNT,
        feedQueries: [FEED],
      },
    )

    expect(store.getQuery(QUERY.path, { eventId: EID })).toBe(false)
    expect(store.getQuery(COUNT.path, { eventId: EID })).toBe(4)
    expect(store.getQuery(FEED.path, {})).toEqual([
      { _id: EID, likeCount: 4, title: 'X' },
      { _id: 'events_other', likeCount: 3 },
    ])
    expect(store.getQuery(BULK.path, { eventIds: [EID] })).toEqual({})
    for (const call of store.setQuery.mock.calls) {
      expect(typeof call[2]).not.toBe('function')
    }
  })

  it('does not corrupt an unloaded single query (undefined stays undefined)', () => {
    const store = makeStore()
    store._map.set(`likes.countByEvent:{"eventId":"${EID}"}`, 5)
    store.getAllQueries.mockReturnValue([])

    applyOptimisticToggle(
      store,
      { eventId: EID },
      {
        query: QUERY,
        bulkQuery: BULK,
        countQuery: COUNT,
        feedQueries: [FEED],
      },
    )

    expect(store.getQuery(QUERY.path, { eventId: EID })).toBeUndefined()
    expect(store.getQuery(COUNT.path, { eventId: EID })).toBe(6)
  })

  it('skips feed instances whose value is not an array', () => {
    const store = makeStore()
    store._map.set(`likes.hasLiked:{"eventId":"${EID}"}`, false)
    store._map.set(`likes.hasLikedBulk:{"eventIds":["${EID}"]}`, {})
    store._map.set(`likes.countByEvent:{"eventId":"${EID}"}`, 0)
    store.getAllQueries.mockReturnValue([{ args: { limit: 5 }, value: { not: 'an array' } }])

    applyOptimisticToggle(
      store,
      { eventId: EID },
      {
        query: QUERY,
        bulkQuery: BULK,
        countQuery: COUNT,
        feedQueries: [FEED],
      },
    )

    // Non-array feed value should be left untouched (setQuery not called for it).
    const calls = store.setQuery.mock.calls
    const feedCalls = calls.filter((c: unknown[]) => c[0] === FEED.path)
    expect(feedCalls).toHaveLength(0)
  })
})
