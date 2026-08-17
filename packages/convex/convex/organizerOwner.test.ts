import { describe, expect, it, vi } from 'vitest'

vi.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: vi.fn(async () => 'users_test'),
}))

const { requireOrganizerOwner } = await import('./helpers')

function makeCtx(opts: {
  profile?: Record<string, unknown> | null
  organizer?: Record<string, unknown> | null
}) {
  const query = vi.fn((table: string) => ({
    withIndex: () => ({
      first: vi.fn(async () =>
        table === 'profiles' ? (opts.profile ?? null) : (opts.organizer ?? null),
      ),
    }),
  }))
  const ctx = { db: { query } } as never
  return { ctx }
}

describe('requireOrganizerOwner', () => {
  it('returns the profile and organizer for an organizer-managed owner', async () => {
    const { ctx } = makeCtx({
      profile: { _id: 'profiles_org', role: 'organizer', suspended: false },
      organizer: { _id: 'organizerProfiles_org', managementMode: 'organizer_managed' },
    })
    const result = await requireOrganizerOwner(ctx)
    expect(result.profile._id).toBe('profiles_org')
    expect(result.organizer._id).toBe('organizerProfiles_org')
  })

  it('refuses a non-organizer role', async () => {
    const { ctx } = makeCtx({ profile: { _id: 'profiles_user', role: 'user', suspended: false } })
    await expect(requireOrganizerOwner(ctx)).rejects.toThrow('Organizer access required')
  })

  it('refuses an admin-managed organizer', async () => {
    const { ctx } = makeCtx({
      profile: { _id: 'profiles_org', role: 'organizer', suspended: false },
      organizer: { _id: 'organizerProfiles_org', managementMode: 'admin_managed' },
    })
    await expect(requireOrganizerOwner(ctx)).rejects.toThrow('managed by the Event Nu team')
  })

  it('refuses when no organizer profile exists', async () => {
    const { ctx } = makeCtx({
      profile: { _id: 'profiles_org', role: 'organizer', suspended: false },
      organizer: null,
    })
    await expect(requireOrganizerOwner(ctx)).rejects.toThrow('Organizer profile not found')
  })
})
