import { describe, expect, it, vi } from 'vitest'

vi.mock('../helpers', () => ({
  requireOrganizerOwner: vi.fn(async () => ({
    profile: { _id: 'profiles_org' },
    organizer: { _id: 'organizerProfiles_org' },
  })),
  requireAdmin: vi.fn(),
  requireUser: vi.fn(),
  insertModerationLog: vi.fn(),
  patchDefined: vi.fn((o: Record<string, unknown>) => o),
  replaceEventImages: vi.fn(),
  uniqueSlug: vi.fn((t: string) => `${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-abcde`),
  insertEventImages: vi.fn(async () => undefined),
}))

vi.mock('../rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

const { createSelf, updateSelf } = await import('./write')
const { requireOrganizerOwner } = await import('../helpers')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const createSelfHandler = (createSelf as unknown as { _handler: Handler })._handler
const updateSelfHandler = (updateSelf as unknown as { _handler: Handler })._handler

function makeCtx(event?: Record<string, unknown> | null) {
  const insert = vi.fn(async () => 'events_new')
  const patch = vi.fn(async () => undefined)
  const get = vi.fn(async () => event ?? null)
  const query = vi.fn(() => ({
    withIndex: () => ({
      first: vi.fn(async () => null),
      take: vi.fn(async () => []),
    }),
  }))
  const db = { insert, patch, get, query }
  return { ctx: { db }, insert, patch }
}

describe('events.createSelf', () => {
  it('creates a pending-review event owned by the organizer', async () => {
    const { ctx, insert } = makeCtx()
    const id = await createSelfHandler(ctx, { title: 'Addis Nights', startDate: 123 })
    expect(id).toBe('events_new')
    expect(insert).toHaveBeenCalledWith(
      'events',
      expect.objectContaining({
        organizerId: 'profiles_org',
        status: 'pending_review',
        source: 'organizer',
        isFeatured: false,
      }),
    )
  })

  it('refuses a non-owner caller', async () => {
    vi.mocked(requireOrganizerOwner).mockRejectedValueOnce(
      new Error('This organizer profile is managed by the Event Nu team'),
    )
    const { ctx } = makeCtx()
    await expect(createSelfHandler(ctx, { title: 'X', startDate: 1 })).rejects.toThrow(
      'managed by the Event Nu team',
    )
  })
})

describe('events.updateSelf', () => {
  it('updates an event owned by the organizer', async () => {
    const { ctx, patch } = makeCtx({
      _id: 'events_own',
      organizerId: 'profiles_org',
    })
    const id = await updateSelfHandler(ctx, { eventId: 'events_own', title: 'New title' })
    expect(id).toBe('events_own')
    expect(patch).toHaveBeenCalledWith(
      'events',
      'events_own',
      expect.objectContaining({ title: 'New title' }),
    )
  })

  it('refuses to edit another organizer event', async () => {
    const { ctx } = makeCtx({ _id: 'events_other', organizerId: 'profiles_other' })
    await expect(updateSelfHandler(ctx, { eventId: 'events_other', title: 'X' })).rejects.toThrow(
      'Not authorized',
    )
  })

  it('refuses to edit a published event', async () => {
    const { ctx } = makeCtx({ _id: 'events_own', organizerId: 'profiles_org', status: 'published' })
    await expect(updateSelfHandler(ctx, { eventId: 'events_own', title: 'X' })).rejects.toThrow(
      'cannot be edited',
    )
  })
})
