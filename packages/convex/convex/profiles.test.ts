import { describe, expect, it, vi } from 'vitest'

vi.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: vi.fn(async () => 'users_test'),
}))

vi.mock('./helpers', () => ({
  getUserProfile: vi.fn(),
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  patchDefined: vi.fn((o: Record<string, unknown>) => o),
}))

const { ensureProfile } = await import('./profiles')
const { getAuthUserId } = await import('@convex-dev/auth/server')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const handler = (ensureProfile as unknown as { _handler: Handler })._handler

function makeCtx(opts: {
  existingByAuth?: Record<string, unknown> | null
  user?: Record<string, unknown> | null
  existingByEmail?: Record<string, unknown> | null
}) {
  const insert = vi.fn(async () => 'profiles_new')
  const patch = vi.fn(async () => undefined)
  const get = vi.fn(async (_table: string, _id: string) => opts.user ?? null)
  const query = vi.fn(() => ({
    withIndex: () => ({
      first: vi.fn(async () => opts.existingByAuth ?? null),
    }),
    filter: () => ({
      first: vi.fn(async () => opts.existingByEmail ?? null),
    }),
  }))
  const db = { get, insert, patch, query }
  return { ctx: { db }, insert, patch, get }
}

describe('profiles.ensureProfile', () => {
  it('creates an organizer profile when accountType is organizer', async () => {
    const { ctx, insert } = makeCtx({
      user: { email: 'org@example.com' },
    })
    const result = await handler(ctx, { fullName: 'Addis Nights', accountType: 'organizer' })
    expect(result).toEqual({ id: 'profiles_new', created: true })
    expect(insert).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ role: 'organizer', verified: false }),
    )
  })

  it('defaults to a user role when accountType is omitted', async () => {
    const { ctx, insert } = makeCtx({
      user: { email: 'user@example.com' },
    })
    await handler(ctx, { fullName: 'Sara' })
    expect(insert).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ role: 'user', verified: false }),
    )
  })

  it('promotes an email-matched user profile to organizer when requested', async () => {
    const { ctx, patch } = makeCtx({
      user: { email: 'org@example.com' },
      existingByEmail: { _id: 'profiles_existing', role: 'user' },
    })
    const result = await handler(ctx, { accountType: 'organizer' })
    expect(result).toEqual({ id: 'profiles_existing', created: false })
    expect(patch).toHaveBeenCalledWith(
      'profiles',
      'profiles_existing',
      expect.objectContaining({ role: 'organizer' }),
    )
  })

  it('returns the existing profile without promotion when already present by auth user', async () => {
    const { ctx, insert } = makeCtx({
      existingByAuth: { _id: 'profiles_existing', role: 'user' },
    })
    const result = await handler(ctx, { accountType: 'organizer' })
    expect(result).toEqual({ id: 'profiles_existing', created: false })
    expect(insert).not.toHaveBeenCalled()
  })

  it('throws when not authenticated', async () => {
    vi.mocked(getAuthUserId).mockResolvedValueOnce(null)
    const { ctx } = makeCtx({})
    await expect(handler(ctx, {})).rejects.toThrow('Not authenticated')
  })
})
