import { describe, expect, it, vi } from 'vitest'

// Mock auth at module level (matches existing pattern in organizerOwner.test.ts)
vi.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: vi.fn(async () => 'users_test'),
}))

const { getUserProfile, requireUser, requireAdmin } = await import('./helpers')
const { getAuthUserId } = await import('@convex-dev/auth/server')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(profile: Record<string, unknown> | null) {
  const query = vi.fn(() => ({
    withIndex: () => ({
      first: vi.fn(async () => profile),
    }),
  }))
  return { db: { query } } as any
}

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------

describe('getUserProfile', () => {
  it('returns the profile when authenticated', async () => {
    const profile = { _id: 'profiles_1', role: 'user', suspended: false }
    const ctx = makeCtx(profile)
    const result = await getUserProfile(ctx)
    expect(result).toEqual(profile)
  })

  it('returns null when not authenticated', async () => {
    vi.mocked(getAuthUserId).mockResolvedValueOnce(null)
    const ctx = makeCtx(null)
    const result = await getUserProfile(ctx)
    expect(result).toBeNull()
  })

  it('returns null when auth user exists but no profile row', async () => {
    const ctx = makeCtx(null)
    const result = await getUserProfile(ctx)
    expect(result).toBeNull()
  })

  it('queries the profiles table with the by_auth_user index', async () => {
    const profile = { _id: 'profiles_1', role: 'user' }
    const ctx = makeCtx(profile)
    await getUserProfile(ctx)
    expect(ctx.db.query).toHaveBeenCalledWith('profiles')
  })
})

// ---------------------------------------------------------------------------
// requireUser
// ---------------------------------------------------------------------------

describe('requireUser', () => {
  it('returns the profile for a non-suspended user', async () => {
    const profile = { _id: 'profiles_1', role: 'user', suspended: false }
    const ctx = makeCtx(profile)
    const result = await requireUser(ctx)
    expect(result).toEqual(profile)
  })

  it('throws "Not authenticated" when no profile exists', async () => {
    vi.mocked(getAuthUserId).mockResolvedValueOnce(null)
    const ctx = makeCtx(null)
    await expect(requireUser(ctx)).rejects.toThrow('Not authenticated')
  })

  it('throws "Account suspended" for a suspended user', async () => {
    const profile = { _id: 'profiles_1', role: 'user', suspended: true }
    const ctx = makeCtx(profile)
    await expect(requireUser(ctx)).rejects.toThrow('Account suspended')
  })

  it('accepts admin role users', async () => {
    const profile = { _id: 'profiles_admin', role: 'admin', suspended: false }
    const ctx = makeCtx(profile)
    const result = await requireUser(ctx)
    expect(result.role).toBe('admin')
  })

  it('accepts organizer role users', async () => {
    const profile = { _id: 'profiles_org', role: 'organizer', suspended: false }
    const ctx = makeCtx(profile)
    const result = await requireUser(ctx)
    expect(result.role).toBe('organizer')
  })
})

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------

describe('requireAdmin', () => {
  it('returns the profile for an admin', async () => {
    const profile = { _id: 'profiles_admin', role: 'admin', suspended: false }
    const ctx = makeCtx(profile)
    const result = await requireAdmin(ctx)
    expect(result).toEqual(profile)
  })

  it('throws "Admin access required" for a regular user', async () => {
    const profile = { _id: 'profiles_user', role: 'user', suspended: false }
    const ctx = makeCtx(profile)
    await expect(requireAdmin(ctx)).rejects.toThrow('Admin access required')
  })

  it('throws "Admin access required" for an organizer', async () => {
    const profile = { _id: 'profiles_org', role: 'organizer', suspended: false }
    const ctx = makeCtx(profile)
    await expect(requireAdmin(ctx)).rejects.toThrow('Admin access required')
  })

  it('throws "Not authenticated" when no profile exists', async () => {
    vi.mocked(getAuthUserId).mockResolvedValueOnce(null)
    const ctx = makeCtx(null)
    await expect(requireAdmin(ctx)).rejects.toThrow('Not authenticated')
  })

  it('throws "Account suspended" for a suspended admin', async () => {
    const profile = { _id: 'profiles_admin', role: 'admin', suspended: true }
    const ctx = makeCtx(profile)
    await expect(requireAdmin(ctx)).rejects.toThrow('Account suspended')
  })
})
