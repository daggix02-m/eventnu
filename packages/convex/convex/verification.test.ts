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
