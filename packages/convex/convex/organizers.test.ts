import { describe, expect, it, vi } from 'vitest'
import type { Doc } from './_generated/dataModel'

vi.mock('./helpers', () => ({
  requireAdmin: vi.fn(async () => ({ _id: 'profiles_admin', role: 'admin' })),
  requireUser: vi.fn(async () => ({ _id: 'profiles_org', role: 'organizer' })),
  patchDefined: vi.fn((o: Record<string, unknown>) => o),
  insertModerationLog: vi.fn(async () => 'moderationLogs_test'),
}))

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => ({ ok: true })) },
}))

const {
  create,
  update,
  getMine,
  setManagementMode,
  resubmit,
  approveApplication,
  rejectApplication,
} = await import('./organizers')
const { requireUser, requireAdmin } = await import('./helpers')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const createHandler = (create as unknown as { _handler: Handler })._handler
const updateHandler = (update as unknown as { _handler: Handler })._handler
const getMineHandler = (getMine as unknown as { _handler: Handler })._handler
const setManagementModeHandler = (setManagementMode as unknown as { _handler: Handler })._handler
const resubmitHandler = (resubmit as unknown as { _handler: Handler })._handler
const approveApplicationHandler = (approveApplication as unknown as { _handler: Handler })._handler
const rejectApplicationHandler = (rejectApplication as unknown as { _handler: Handler })._handler

function makeCtx(opts: { existing?: Record<string, unknown> | null } = {}) {
  const insert = vi.fn(async () => 'organizerProfiles_new')
  const patch = vi.fn(async () => undefined)
  const query = vi.fn(() => ({
    withIndex: () => ({
      first: vi.fn(async () => opts.existing ?? null),
    }),
  }))
  const db = { insert, patch, query }
  return { ctx: { db }, insert, patch }
}

describe('organizers.create (self-service)', () => {
  it('creates an organizer profile for the signed-in user', async () => {
    const { ctx, insert } = makeCtx()
    const id = await createHandler(ctx, { organizerName: 'Addis Nights' })
    expect(id).toBe('organizerProfiles_new')
    expect(insert).toHaveBeenCalledWith(
      'organizerProfiles',
      expect.objectContaining({
        profileId: 'profiles_org',
        organizerName: 'Addis Nights',
        applicationStatus: 'pending_review',
        verified: false,
        followerCount: 0,
      }),
    )
  })

  it('promotes the profile to organizer role when needed', async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      _id: 'profiles_org' as Doc<'profiles'>['_id'],
      role: 'user',
    } as Doc<'profiles'>)
    const { ctx, patch } = makeCtx()
    await createHandler(ctx, { organizerName: 'Addis Nights' })
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_org', { role: 'organizer' })
  })

  it('rejects when an organizer profile already exists', async () => {
    const { ctx } = makeCtx({ existing: { _id: 'organizerProfiles_existing' } })
    await expect(createHandler(ctx, { organizerName: 'X' })).rejects.toThrow('already exists')
  })
})

describe('organizer application review', () => {
  it('resubmits a rejected application', async () => {
    const { ctx, patch } = makeCtx({
      existing: { _id: 'organizerProfiles_existing', applicationStatus: 'rejected' },
    })
    await resubmitHandler(ctx, {})
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      applicationStatus: 'pending_review',
      rejectionReason: undefined,
    })
  })

  it('allows admins to approve an application', async () => {
    const { ctx, patch } = makeCtx({ existing: { _id: 'organizerProfiles_existing' } })
    await approveApplicationHandler(ctx, { profileId: 'profiles_org' })
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      applicationStatus: 'approved',
      rejectionReason: undefined,
    })
  })

  it('allows admins to reject an application with a reason', async () => {
    const { ctx, patch } = makeCtx({ existing: { _id: 'organizerProfiles_existing' } })
    await rejectApplicationHandler(ctx, { profileId: 'profiles_org', reason: 'Need more details' })
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      applicationStatus: 'rejected',
      rejectionReason: 'Need more details',
    })
  })
})

describe('organizers.update (self-service)', () => {
  it('allows a user to update their own organizer-managed profile', async () => {
    const { ctx, patch } = makeCtx({
      existing: { _id: 'organizerProfiles_existing', managementMode: 'organizer_managed' },
    })
    await updateHandler(ctx, { profileId: 'profiles_org', organizerName: 'New Name' })
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      organizerName: 'New Name',
    })
  })

  it('refuses to update another profile', async () => {
    const { ctx } = makeCtx()
    await expect(
      updateHandler(ctx, { profileId: 'profiles_other', organizerName: 'X' }),
    ).rejects.toThrow('Not authorized')
  })

  it('refuses to edit an admin-managed profile', async () => {
    const { ctx } = makeCtx({
      existing: { _id: 'organizerProfiles_existing', managementMode: 'admin_managed' },
    })
    await expect(
      updateHandler(ctx, { profileId: 'profiles_org', organizerName: 'Tampered' }),
    ).rejects.toThrow('managed by the Event Nu team')
  })

  it('throws when the organizer profile does not exist', async () => {
    const { ctx } = makeCtx({ existing: null })
    await expect(
      updateHandler(ctx, { profileId: 'profiles_org', organizerName: 'X' }),
    ).rejects.toThrow('Organizer profile not found')
  })

  it('allows an admin to edit any profile regardless of management mode', async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      _id: 'profiles_admin',
      role: 'admin',
    } as Doc<'profiles'>)
    const { ctx, patch } = makeCtx({
      existing: { _id: 'organizerProfiles_existing', managementMode: 'admin_managed' },
    })
    await updateHandler(ctx, { profileId: 'profiles_org', organizerName: 'Admin Edit' })
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      organizerName: 'Admin Edit',
    })
  })
})

describe('organizers.getMine', () => {
  it('returns the signed-in organizer profile', async () => {
    const { ctx } = makeCtx({ existing: { _id: 'organizerProfiles_existing' } })
    const result = await getMineHandler(ctx, {})
    expect(result).toEqual({ _id: 'organizerProfiles_existing' })
  })
})

describe('organizers.setManagementMode', () => {
  it('updates management mode and logs moderation', async () => {
    const { ctx, patch } = makeCtx({ existing: { _id: 'organizerProfiles_existing' } })
    await setManagementModeHandler(ctx, {
      profileId: 'profiles_org',
      managementMode: 'admin_managed',
    })
    expect(patch).toHaveBeenCalledWith('organizerProfiles', 'organizerProfiles_existing', {
      managementMode: 'admin_managed',
    })
  })

  it('refuses non-admin callers', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Admin access required'))
    const { ctx } = makeCtx()
    await expect(
      setManagementModeHandler(ctx, { profileId: 'profiles_org', managementMode: 'admin_managed' }),
    ).rejects.toThrow('Admin access required')
  })
})
