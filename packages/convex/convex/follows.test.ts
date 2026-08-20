import { describe, expect, it, vi } from 'vitest'

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

vi.mock('./helpers', () => ({
  requireUser: vi.fn(async () => ({ _id: 'profiles_me', role: 'user' })),
}))

const { toggle, listFollowers } = await import('./follows')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const toggleHandler = (toggle as unknown as { _handler: Handler })._handler
const listFollowersHandler = (listFollowers as unknown as { _handler: Handler })._handler

function makeToggleCtx(opts: {
  existing?: Array<Record<string, unknown>>
  user?: Record<string, unknown> | null
  organizer?: Record<string, unknown> | null
}) {
  const insert = vi.fn(async () => 'follows_new')
  const del = vi.fn(async () => undefined)
  const patch = vi.fn(async () => undefined)
  const get = vi.fn(async (table: string, _id: string) => {
    if (table === 'profiles') return opts.user ?? null
    if (table === 'organizerProfiles') return opts.organizer ?? null
    return null
  })
  const query = vi.fn(() => ({
    withIndex: () => ({
      take: vi.fn(async () => opts.existing ?? []),
      first: vi.fn(async () => opts.existing?.[0] ?? null),
    }),
  }))
  const db = { insert, delete: del, patch, get, query }
  return { ctx: { db }, insert, patch }
}

describe('follows.toggle (user)', () => {
  it('follows a user and increments their follower count', async () => {
    const { ctx, insert, patch } = makeToggleCtx({
      existing: [],
      user: { _id: 'profiles_target', followerCount: 5 },
    })
    const result = await toggleHandler(ctx, { followingId: 'profiles_target', followType: 'user' })
    expect(result).toBe(true)
    expect(insert).toHaveBeenCalledWith('follows', expect.objectContaining({ followType: 'user' }))
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_target', { followerCount: 6 })
  })

  it('unfollows and decrements when already following', async () => {
    const { ctx, patch } = makeToggleCtx({
      existing: [{ _id: 'follows_existing', followType: 'user' }],
      user: { _id: 'profiles_target', followerCount: 5 },
    })
    const result = await toggleHandler(ctx, { followingId: 'profiles_target', followType: 'user' })
    expect(result).toBe(false)
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_target', { followerCount: 4 })
  })
})

describe('follows.toggle (organizer)', () => {
  it('follows an organizer profile and increments its follower count', async () => {
    const { ctx, insert, patch } = makeToggleCtx({
      existing: [],
      organizer: { _id: 'organizerProfiles_target', followerCount: 10 },
    })
    const result = await toggleHandler(ctx, {
      followingId: 'organizerProfiles_target',
      followType: 'organizer',
    })
    expect(result).toBe(true)
    expect(insert).toHaveBeenCalledWith(
      'follows',
      expect.objectContaining({ followType: 'organizer' }),
    )
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_target', {
      followerCount: 11,
    })
  })

  it('unfollows an organizer profile and decrements its follower count', async () => {
    const { ctx, patch } = makeToggleCtx({
      existing: [{ _id: 'follows_existing', followType: 'organizer' }],
      organizer: { _id: 'organizerProfiles_target', followerCount: 10 },
    })
    const result = await toggleHandler(ctx, {
      followingId: 'organizerProfiles_target',
      followType: 'organizer',
    })
    expect(result).toBe(false)
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_target', {
      followerCount: 9,
    })
  })

  it('tolerates a missing target without throwing', async () => {
    const { ctx, insert } = makeToggleCtx({ existing: [], organizer: null })
    const result = await toggleHandler(ctx, {
      followingId: 'organizerProfiles_missing',
      followType: 'organizer',
    })
    expect(result).toBe(true)
    expect(insert).toHaveBeenCalled()
  })
})

function makeListFollowersCtx(opts: {
  follows: Array<Record<string, unknown>>
  profiles: Record<string, Record<string, unknown>>
}) {
  const get = vi.fn(async (_table: string, id: string) => opts.profiles[id] ?? null)
  const query = vi.fn(() => ({
    withIndex: () => ({
      take: vi.fn(async () => opts.follows),
    }),
  }))
  const db = { get, query }
  return { ctx: { db } }
}

describe('follows.listFollowers', () => {
  it('returns follower profiles for the requested follow type', async () => {
    const { ctx } = makeListFollowersCtx({
      follows: [
        { _id: 'f1', followerId: 'profiles_a', followingId: 'profiles_target', followType: 'user' },
        {
          _id: 'f2',
          followerId: 'profiles_b',
          followingId: 'profiles_target',
          followType: 'organizer',
        },
      ],
      profiles: {
        profiles_a: { _id: 'profiles_a', fullName: 'A', avatarUrl: null },
        profiles_b: { _id: 'profiles_b', fullName: 'B', avatarUrl: null },
      },
    })
    const result = await listFollowersHandler(ctx, {
      followingId: 'profiles_target',
      followType: 'user',
    })
    expect(result).toEqual([{ id: 'profiles_a', fullName: 'A', avatarUrl: null }])
  })
})
