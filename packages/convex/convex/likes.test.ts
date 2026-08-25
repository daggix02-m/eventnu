import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Doc } from './_generated/dataModel'

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

vi.mock('./helpers', () => ({
  getUserProfile: vi.fn(async () => null),
  requireUser: vi.fn(async () => ({
    _id: 'profiles_user',
    suspended: false,
    role: 'user',
  })),
  incrementEngagementCounter: vi.fn(async () => undefined),
}))

const { toggle, setLiked, countByEvent } = await import('./likes')
const { LIKE_COUNT_SHARDS } = await import('./constants')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const toggleHandler = (toggle as unknown as { _handler: Handler })._handler
const setLikedHandler = (setLiked as unknown as { _handler: Handler })._handler
const countHandler = (countByEvent as unknown as { _handler: Handler })._handler

const EVENT_ID = 'events_test' as Doc<'events'>['_id']
const USER_ID = 'profiles_user'

/**
 * Stateful fake of ctx.db supporting the queries `likes.ts` uses:
 *  - eventLikes       via by_userId_and_eventId -> { userId, eventId }
 *  - likeCountShards  via by_eventId_and_shard  -> { eventId, shard, count }
 *  - events           via get()                 -> { likeCount }
 */
function makeDb() {
  const likes: Array<{ _id: string; userId: string; eventId: string }> = []
  const shards: Array<{ _id: string; eventId: string; shard: number; count: number }> = []
  let eventLikeCount = 0
  let likeSeq = 0
  const patches: Array<{ table: string; id: string; fields: Record<string, unknown> }> = []

  function query(table: string) {
    const api = {
      withIndex: (_index: string, pred?: (q: Record<string, unknown>) => unknown) => {
        const applyPred = () => pred ?? (() => true)
        const filterLikes = (predFn: any) => {
          const cond = predFn as (q: any) => unknown
          // pred is called with a builder q; extract eq() constraints.
          const constraints: Record<string, string> = {}
          const q = {
            eq: (k: string, v: string) => {
              constraints[k] = v
              return q
            },
          }
          cond(q)
          return likes.filter((l) =>
            Object.entries(constraints).every(([k, v]) => (l as any)[k] === v),
          )
        }
        const filterShards = (predFn: any) => {
          const constraints: Record<string, string | number> = {}
          const q = {
            eq: (k: string, v: string | number) => {
              constraints[k] = v
              return q
            },
          }
          predFn?.(q)
          return shards
            .filter((s) => Object.entries(constraints).every(([k, v]) => (s as any)[k] === v))
            .sort((a, b) => a.shard - b.shard)
        }
        if (table === 'eventLikes') {
          return {
            first: async () => filterLikes(applyPred())[0] ?? null,
          }
        }
        if (table === 'likeCountShards') {
          const filtered = filterShards(applyPred())
          return {
            first: async () => filtered[0] ?? null,
            take: async (n: number) => filtered.slice(0, n),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    }
    return api
  }

  const db = {
    query,
    get: vi.fn(async (_t: string, id: string) =>
      id === EVENT_ID ? { _id: EVENT_ID, likeCount: eventLikeCount } : null,
    ),
    insert: vi.fn(async (table: string, doc: any) => {
      if (table === 'eventLikes') likes.push({ _id: `like_${likeSeq++}`, ...doc })
      if (table === 'likeCountShards') {
        shards.push({ _id: `shard_${doc.eventId}_${doc.shard}`, ...doc })
      }
      return `${table}_inserted`
    }),
    delete: vi.fn(async (table: string, id: string) => {
      if (table === 'eventLikes') {
        const idx = likes.findIndex((l) => l._id === id)
        if (idx >= 0) likes.splice(idx, 1)
      }
    }),
    patch: vi.fn(async (table: string, id: string, fields: Record<string, unknown>) => {
      patches.push({ table, id, fields })
      if (table === 'likeCountShards') {
        const s = shards.find((x) => x._id === id)
        if (s) Object.assign(s, fields)
      }
      if (table === 'events' && id === EVENT_ID) {
        eventLikeCount = (fields as any).likeCount
      }
    }),
  }

  const shardTotal = () => shards.reduce((sum, s) => sum + s.count, 0)

  return {
    db,
    likes,
    shards,
    shardTotal,
    patches,
    setEventLikeCount: (n: number) => (eventLikeCount = n),
  }
}

function makeCtx(db: ReturnType<typeof makeDb>['db']) {
  return { db } as unknown as Parameters<Handler>[0]
}

describe('likes.toggle (sharded counter)', () => {
  let d: ReturnType<typeof makeDb>
  let ctx: unknown

  beforeEach(() => {
    d = makeDb()
    ctx = makeCtx(d.db)
  })
  it('bootstraps shards from events.likeCount on first like, then increments', async () => {
    d.setEventLikeCount(7)
    const result = await toggleHandler(ctx, { eventId: EVENT_ID })

    expect(result).toBe(true)
    // All shards created.
    expect(d.shards).toHaveLength(LIKE_COUNT_SHARDS)
    // The seed lives in shard 0 (may be 7 or 8 if the random increment hit it).
    const seed = d.shards.find((s) => s.shard === 0)!
    expect([7, 8]).toContain(seed.count)
    // One like -> total is seed + 1.
    expect(d.shardTotal()).toBe(8)
    // A like was recorded.
    expect(d.likes).toHaveLength(1)
  })

  it('increments the shard total on like and decrements on unlike', async () => {
    // First like: no existing.
    await toggleHandler(ctx, { eventId: EVENT_ID })
    const afterLike = d.shardTotal()
    expect(afterLike).toBe(1)

    // Second toggle = unlike (existing like present).
    const result = await toggleHandler(ctx, { eventId: EVENT_ID })
    expect(result).toBe(false)
    expect(d.shardTotal()).toBe(0)
    expect(d.likes).toHaveLength(0)
  })

  it('never drives the total negative', async () => {
    d.setEventLikeCount(0)
    // Manually seed shards with 0 so unlike has nothing to decrement past 0.
    await toggleHandler(ctx, { eventId: EVENT_ID })
    await toggleHandler(ctx, { eventId: EVENT_ID }) // like then unlike
    await toggleHandler(ctx, { eventId: EVENT_ID }) // like again (1)
    await toggleHandler(ctx, { eventId: EVENT_ID }) // unlike (0)
    await toggleHandler(ctx, { eventId: EVENT_ID }) // like (1)
    expect(d.shardTotal()).toBe(1)
  })
})

describe('likes.countByEvent', () => {
  it('returns the sum of all shards for an event', async () => {
    const d = makeDb()
    // Seed shards directly.
    for (let i = 0; i < LIKE_COUNT_SHARDS; i++) {
      await d.db.insert('likeCountShards', { eventId: EVENT_ID, shard: i, count: i === 0 ? 10 : i })
    }
    const expected =
      10 + Array.from({ length: LIKE_COUNT_SHARDS - 1 }, (_, i) => i + 1).reduce((a, b) => a + b, 0)
    const ctx = makeCtx(d.db)
    const total = (await countHandler(ctx, { eventId: EVENT_ID })) as number
    expect(total).toBe(expected)
  })
})

describe('likes.setLiked', () => {
  let d: ReturnType<typeof makeDb>
  let ctx: unknown

  beforeEach(() => {
    d = makeDb()
    ctx = makeCtx(d.db)
  })

  it('is idempotent for repeated likes', async () => {
    await setLikedHandler(ctx, { eventId: EVENT_ID, liked: true })
    await setLikedHandler(ctx, { eventId: EVENT_ID, liked: true })
    expect(d.shardTotal()).toBe(1)
    expect(d.likes).toHaveLength(1)
  })

  it('is idempotent for repeated unlikes', async () => {
    await setLikedHandler(ctx, { eventId: EVENT_ID, liked: true })
    await setLikedHandler(ctx, { eventId: EVENT_ID, liked: false })
    await setLikedHandler(ctx, { eventId: EVENT_ID, liked: false })
    expect(d.shardTotal()).toBe(0)
    expect(d.likes).toHaveLength(0)
  })
})
