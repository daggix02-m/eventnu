import { describe, expect, it, vi } from 'vitest'

vi.mock('./helpers', () => ({
  requireOrganizerOwner: vi.fn(async () => ({
    profile: { _id: 'profiles_org' },
    organizer: { _id: 'organizerProfiles_org' },
  })),
  requireAdmin: vi.fn(async () => ({ _id: 'profiles_admin', role: 'admin' })),
  patchDefined: vi.fn((o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)),
  ),
}))

const { get, update } = await import('./organizerSettings')
const { requireOrganizerOwner } = await import('./helpers')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const getHandler = (get as unknown as { _handler: Handler })._handler
const updateHandler = (update as unknown as { _handler: Handler })._handler

function makeCtx(existing?: Record<string, unknown> | null) {
  const insert = vi.fn(async () => 'organizerSettings_new')
  const patch = vi.fn(async () => undefined)
  const query = vi.fn(() => ({
    withIndex: () => ({ first: vi.fn(async () => existing ?? null) }),
  }))
  const db = { insert, patch, query }
  return { ctx: { db }, insert, patch }
}

describe('organizerSettings.get', () => {
  it('returns existing settings for the owner', async () => {
    const { ctx } = makeCtx({ _id: 'organizerSettings_existing', hideLikeCount: true })
    const result = await getHandler(ctx, {})
    expect(result).toEqual({ _id: 'organizerSettings_existing', hideLikeCount: true })
  })

  it('returns null when no settings exist', async () => {
    const { ctx } = makeCtx(null)
    const result = await getHandler(ctx, {})
    expect(result).toBeNull()
  })
})

describe('organizerSettings.update', () => {
  it('inserts defaults merged with provided fields when none exist', async () => {
    const { ctx, insert } = makeCtx(null)
    await updateHandler(ctx, { hideLikeCount: true })
    expect(insert).toHaveBeenCalledWith(
      'organizerSettings',
      expect.objectContaining({
        profileId: 'profiles_org',
        hideLikeCount: true,
        notificationEmail: true,
        tagSetting: 'allow',
      }),
    )
  })

  it('patches existing settings', async () => {
    const { ctx, patch } = makeCtx({ _id: 'organizerSettings_existing' })
    const id = await updateHandler(ctx, { archiveEvents: true })
    expect(id).toBe('organizerSettings_existing')
    expect(patch).toHaveBeenCalledWith('organizerSettings', 'organizerSettings_existing', {
      archiveEvents: true,
    })
  })

  it('refuses a non-owner caller', async () => {
    vi.mocked(requireOrganizerOwner).mockRejectedValueOnce(new Error('Organizer access required'))
    const { ctx } = makeCtx(null)
    await expect(updateHandler(ctx, {})).rejects.toThrow('Organizer access required')
  })
})
