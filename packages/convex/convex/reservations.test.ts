import { describe, expect, it, vi } from 'vitest'
import { Doc } from './_generated/dataModel'

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

vi.mock('./helpers', () => ({
  getUserProfile: vi.fn(async () => null),
  requireAdmin: vi.fn(async () => ({ _id: 'profiles_admin' })),
}))

const { create } = await import('./reservations')

type CreateHandler = (ctx: unknown, args: unknown) => Promise<unknown>
const createHandler = (create as unknown as { _handler: CreateHandler })._handler

function makeEventDoc(overrides: Partial<Doc<'events'>> = {}): Doc<'events'> {
  const now = Date.now()
  return {
    _id: 'events_test' as Doc<'events'>['_id'],
    _creationTime: 1,
    title: 'Sauti Sol Live',
    description: 'A night of Afro-pop',
    startDate: now + 1000,
    endDate: now + 100_000,
    status: 'published',
    source: 'admin',
    isFree: false,
    actionType: 'reservation',
    isStandalone: false,
    isFeatured: false,
    frequencyType: 'once',
    reservationEnabled: true,
    reservationLimit: 50,
    reservationCount: 0,
    likeCount: 0,
    timezone: 'Africa/Addis_Ababa',
    venueName: 'Sheraton Addis',
    ...overrides,
  }
}

function makeCtx(event: Doc<'events'>) {
  const patch = vi.fn(async () => undefined)
  const insert = vi.fn(async () => 'reservationRequests_test')
  const db = {
    get: vi.fn(async () => event),
    patch,
    insert,
  }
  const scheduler = { runAfter: vi.fn(() => undefined) }
  const ctx = { db, scheduler } as unknown as Parameters<CreateHandler>[0]
  return { ctx, patch, insert, scheduler }
}

const validArgs = {
  eventId: 'events_test' as Doc<'events'>['_id'],
  name: 'Sara',
  email: 's@example.com',
}

describe('reservations.create guards', () => {
  it('rejects reservations for non-published events', async () => {
    const { ctx } = makeCtx(makeEventDoc({ status: 'pending_review' }))
    await expect(createHandler(ctx, validArgs)).rejects.toThrow('Reservations are not open')
  })

  it('rejects reservations for cancelled events', async () => {
    const { ctx } = makeCtx(makeEventDoc({ status: 'cancelled' }))
    await expect(createHandler(ctx, validArgs)).rejects.toThrow('Reservations are not open')
  })

  it('rejects reservations for ended events', async () => {
    const { ctx } = makeCtx(makeEventDoc({ endDate: Date.now() - 1000 }))
    await expect(createHandler(ctx, validArgs)).rejects.toThrow('This event has ended')
  })

  it('still rejects when the reservation limit is reached', async () => {
    const { ctx } = makeCtx(
      makeEventDoc({ reservationEnabled: true, reservationLimit: 1, reservationCount: 1 }),
    )
    await expect(createHandler(ctx, validArgs)).rejects.toThrow('Reservation limit reached')
  })

  it('creates a reservation for a published, open event', async () => {
    const { ctx, patch, insert, scheduler } = makeCtx(makeEventDoc())
    const id = await createHandler(ctx, validArgs)
    expect(id).toBe('reservationRequests_test')
    expect(patch).toHaveBeenCalledWith('events', 'events_test', { reservationCount: 1 })
    expect(insert).toHaveBeenCalledWith(
      'reservationRequests',
      expect.objectContaining({ status: 'pending' }),
    )
    expect(scheduler.runAfter).toHaveBeenCalledTimes(2)
  })

  it('rejects reservations with invalid email format', async () => {
    const { ctx } = makeCtx(makeEventDoc())
    await expect(createHandler(ctx, { ...validArgs, email: 'not-an-email' })).rejects.toThrow(
      'valid email address',
    )
  })

  it('normalizes email to lowercase', async () => {
    const { ctx, insert } = makeCtx(makeEventDoc())
    await createHandler(ctx, { ...validArgs, email: 'SARA@EXAMPLE.COM' })
    expect(insert).toHaveBeenCalledWith(
      'reservationRequests',
      expect.objectContaining({ email: 'sara@example.com' }),
    )
  })
})
