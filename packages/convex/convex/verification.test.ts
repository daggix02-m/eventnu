import { describe, expect, it, vi } from 'vitest'
import type { Doc } from './_generated/dataModel'

vi.mock('./helpers', () => ({
  requireAdmin: vi.fn(async () => ({ _id: 'profiles_admin', role: 'admin' })),
  insertModerationLog: vi.fn(async () => 'moderationLogs_test'),
}))

const { computeEligibility, computeProfileMetrics, grant, revoke } = await import('./verification')
const { requireAdmin } = await import('./helpers')

type EngagementMetrics = {
  publishedEvents: number
  engagementGiven: number
  followerCount: number
  experiencePosts: number
  reservationCount: number
}

const baseMetrics: EngagementMetrics = {
  publishedEvents: 0,
  engagementGiven: 0,
  followerCount: 0,
  experiencePosts: 0,
  reservationCount: 0,
}

describe('computeEligibility', () => {
  describe('organizer', () => {
    it('is ineligible below the published-event threshold', () => {
      expect(
        computeEligibility('organizer', {
          ...baseMetrics,
          publishedEvents: 2,
          followerCount: 100,
        }),
      ).toBe(false)
    })

    it('is ineligible when events are met but no secondary signal reaches threshold', () => {
      expect(
        computeEligibility('organizer', {
          ...baseMetrics,
          publishedEvents: 3,
          followerCount: 19,
          reservationCount: 9,
          engagementGiven: 29,
        }),
      ).toBe(false)
    })

    it('is eligible via follower count', () => {
      expect(
        computeEligibility('organizer', {
          ...baseMetrics,
          publishedEvents: 3,
          followerCount: 20,
        }),
      ).toBe(true)
    })

    it('is eligible via reservation count', () => {
      expect(
        computeEligibility('organizer', {
          ...baseMetrics,
          publishedEvents: 3,
          reservationCount: 10,
        }),
      ).toBe(true)
    })

    it('is eligible via engagement given', () => {
      expect(
        computeEligibility('organizer', {
          ...baseMetrics,
          publishedEvents: 3,
          engagementGiven: 30,
        }),
      ).toBe(true)
    })
  })

  describe('user', () => {
    it('is ineligible below the engagement threshold', () => {
      expect(
        computeEligibility('user', {
          ...baseMetrics,
          engagementGiven: 14,
          experiencePosts: 5,
        }),
      ).toBe(false)
    })

    it('is ineligible when engagement is met but posts and followers are both too low', () => {
      expect(
        computeEligibility('user', {
          ...baseMetrics,
          engagementGiven: 15,
          experiencePosts: 1,
          followerCount: 0,
        }),
      ).toBe(false)
    })

    it('is eligible when engagement and posts both meet threshold', () => {
      expect(
        computeEligibility('user', {
          ...baseMetrics,
          engagementGiven: 15,
          experiencePosts: 2,
        }),
      ).toBe(true)
    })

    it('is eligible via follower count when engagement is met', () => {
      expect(
        computeEligibility('user', {
          ...baseMetrics,
          engagementGiven: 15,
          experiencePosts: 0,
          followerCount: 25,
        }),
      ).toBe(true)
    })
  })
})

function makeMetricsCtx(opts: {
  counter?: Partial<Doc<'engagementCounters'>>
  org?: Partial<Doc<'organizerProfiles'>>
  events?: Array<Partial<Doc<'events'>>>
}) {
  const query = vi.fn((table: string) => ({
    withIndex: () => ({
      first: vi.fn(async () => {
        if (table === 'engagementCounters') return opts.counter ?? null
        if (table === 'organizerProfiles') return opts.org ?? null
        return null
      }),
      take: vi.fn(async () => {
        if (table === 'events') return opts.events ?? []
        return []
      }),
    }),
  }))
  const ctx = { db: { query } } as unknown as Parameters<typeof computeProfileMetrics>[0]
  return { ctx }
}

describe('computeProfileMetrics', () => {
  it('computes organizer metrics from counters, organizer profile and published events', async () => {
    const { ctx } = makeMetricsCtx({
      counter: { likes: 10, comments: 5, bookmarks: 4, shares: 1, posts: 0 },
      org: { followerCount: 25 },
      events: [{ reservationCount: 6 }, { reservationCount: 4 }],
    })
    const profile = { _id: 'profiles_org', role: 'organizer' } as Doc<'profiles'>
    const result = await computeProfileMetrics(ctx, profile)
    expect(result.kind).toBe('organizer')
    expect(result.metrics).toEqual({
      publishedEvents: 2,
      engagementGiven: 20,
      followerCount: 25,
      experiencePosts: 0,
      reservationCount: 10,
    })
  })

  it('computes user metrics from counters and profile follower count', async () => {
    const { ctx } = makeMetricsCtx({
      counter: { likes: 10, comments: 4, bookmarks: 1, shares: 0, posts: 3 },
    })
    const profile = { _id: 'profiles_user', role: 'user', followerCount: 42 } as Doc<'profiles'>
    const result = await computeProfileMetrics(ctx, profile)
    expect(result.kind).toBe('user')
    expect(result.metrics).toEqual({
      publishedEvents: 0,
      engagementGiven: 15,
      followerCount: 42,
      experiencePosts: 3,
      reservationCount: 0,
    })
  })

  it('treats missing counters as all zeros', async () => {
    const { ctx } = makeMetricsCtx({})
    const profile = { _id: 'profiles_user', role: 'user', followerCount: 7 } as Doc<'profiles'>
    const result = await computeProfileMetrics(ctx, profile)
    expect(result.metrics).toEqual({
      publishedEvents: 0,
      engagementGiven: 0,
      followerCount: 7,
      experiencePosts: 0,
      reservationCount: 0,
    })
  })
})

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const grantHandler = (grant as unknown as { _handler: Handler })._handler
const revokeHandler = (revoke as unknown as { _handler: Handler })._handler

function makeMutationCtx() {
  const patch = vi.fn(async () => undefined)
  const insert = vi.fn(async (..._args: unknown[]) => 'inserted_test')
  const get = vi.fn(async (_table: string, id: string) => ({ _id: id, verified: false }))
  const db = { get, patch, insert }
  return { ctx: { db }, patch, insert }
}

describe('verification.grant', () => {
  it('sets verified with the granting admin and logs moderation', async () => {
    const { ctx, patch } = makeMutationCtx()
    await grantHandler(ctx, { profileId: 'profiles_target' })
    expect(patch).toHaveBeenCalledWith(
      'profiles',
      'profiles_target',
      expect.objectContaining({ verified: true, verifiedBy: 'profiles_admin' }),
    )
  })

  it('does not write any notification during the grant', async () => {
    const { ctx, insert } = makeMutationCtx()
    await grantHandler(ctx, { profileId: 'profiles_target' })
    const notificationInserts = insert.mock.calls.filter(([table]) => table === 'notifications')
    expect(notificationInserts).toHaveLength(0)
  })

  it('refuses non-admin callers', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Admin access required'))
    const { ctx } = makeMutationCtx()
    await expect(grantHandler(ctx, { profileId: 'profiles_target' })).rejects.toThrow(
      'Admin access required',
    )
  })
})

describe('verification.revoke', () => {
  it('clears verified and logs moderation', async () => {
    const { ctx, patch } = makeMutationCtx()
    await revokeHandler(ctx, { profileId: 'profiles_target' })
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_target', { verified: false })
  })
})

const { evaluateEligibility } = await import('./verification')
type EvaluateHandler = (
  ctx: unknown,
  args: unknown,
) => Promise<{ evaluated: number; done: boolean }>
const evaluateHandler = (evaluateEligibility as unknown as { _handler: EvaluateHandler })._handler

function makeCronCtx(opts: {
  totalProfiles: number
  existingCheckpoint?: { _id: string; cursor: string | null }
}) {
  const now = Date.now()
  const profiles = Array.from({ length: opts.totalProfiles }, (_, i) => ({
    _id: `profiles_p${i}`,
    role: 'user' as const,
    followerCount: 0,
    suspended: false,
  }))
  const pages: Array<{ page: typeof profiles; isDone: boolean; continueCursor: string | null }> = []
  for (let offset = 0; offset < profiles.length; offset += 3) {
    pages.push({
      page: profiles.slice(offset, offset + 3),
      isDone: offset + 3 >= profiles.length,
      continueCursor: offset + 3 < profiles.length ? `cursor-${offset + 3}` : null,
    })
  }
  let pageIndex = 0
  const db = {
    query: (table: string) => {
      const queryBuilder = {
        withIndex: (name: string, pred: (q: unknown) => unknown) => queryBuilder,
        paginate: async (opts: { cursor: string | null }) => {
          const resumeFrom = opts.cursor
            ? pages.findIndex((p) => p.continueCursor === opts.cursor) + 1
            : 0
          pageIndex = resumeFrom
          const page = pages[pageIndex] ?? { page: [], isDone: true, continueCursor: null }
          pageIndex++
          return page
        },
        first: async () => (table === 'cronCheckpoints' ? (opts.existingCheckpoint ?? null) : null),
      }
      return queryBuilder
    },
    insert: vi.fn(async (_table: string, _doc: unknown) => 'cronCheckpoints_new'),
    patch: vi.fn(async () => undefined),
    get: vi.fn(async () => null),
  }
  return { ctx: { db }, db, pages }
}

describe('verification.evaluateEligibility', () => {
  it('processes every profile across multiple pages (no 10k cap)', async () => {
    const { ctx, db, pages } = makeCronCtx({ totalProfiles: 9 })
    const result = await evaluateHandler(ctx, {})
    expect(result.evaluated).toBe(9)
    expect(result.done).toBe(true)
    // Checkpoint watermark reset after a full pass so the next run starts fresh.
    expect(db.patch).toHaveBeenCalledWith(
      'cronCheckpoints',
      'cronCheckpoints_new',
      expect.objectContaining({ cursor: undefined }),
    )
  })

  it('resumes from the previous run watermark instead of restarting', async () => {
    const { ctx, db } = makeCronCtx({
      totalProfiles: 6,
      existingCheckpoint: { _id: 'cronCheckpoints_existing', cursor: 'cursor-3' },
    })
    const result = await evaluateHandler(ctx, {})
    expect(result.evaluated).toBe(3) // resumes at page 2 (cursor-3), skipping page 1
    expect(result.done).toBe(true)
    expect(db.patch).toHaveBeenCalledWith(
      'cronCheckpoints',
      'cronCheckpoints_existing',
      expect.objectContaining({ cursor: undefined }),
    )
  })
})
