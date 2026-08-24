import { describe, it, expect } from 'vitest'
import { getHeroCta } from './EventHero'
import type { Event } from '@/types'

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'ev_1',
    title: 'Test Event',
    description: 'A test event',
    start_date: '2099-01-01T18:00:00Z',
    is_free: false,
    status: 'published',
    organizer_id: undefined,
    venue_name: 'Venue',
    ...overrides,
  }
}

describe('getHeroCta', () => {
  it('returns ended CTA for past events', () => {
    const cta = getHeroCta(makeEvent({ start_date: '2020-01-01T18:00:00Z' }))
    expect(cta.kind).toBe('ended')
    expect(cta.label).toBe('Event Ended')
    expect(cta.href).toBeUndefined()
  })

  it('returns external CTA with custom label when the external link is safe', () => {
    const cta = getHeroCta(
      makeEvent({
        external_link: 'https://tickets.example.com',
        external_link_label: 'Buy Now',
      }),
    )
    expect(cta.kind).toBe('external')
    expect(cta.label).toBe('Buy Now')
    expect(cta.href).toBe('https://tickets.example.com')
  })

  it('defaults the external label to Get Tickets for paid events', () => {
    const cta = getHeroCta(makeEvent({ external_link: 'https://tickets.example.com' }))
    expect(cta.kind).toBe('external')
    expect(cta.label).toBe('Get Tickets')
  })

  it('defaults the external label to More Info for free events', () => {
    const cta = getHeroCta(makeEvent({ is_free: true, external_link: 'https://example.com' }))
    expect(cta.kind).toBe('external')
    expect(cta.label).toBe('More Info')
  })

  it('never renders an external CTA for unsafe schemes', () => {
    const cta = getHeroCta(makeEvent({ external_link: 'javascript:alert(1)' }))
    expect(cta.kind).not.toBe('external')
  })

  it('returns reservation CTA anchored to the reservation form', () => {
    const cta = getHeroCta(makeEvent({ action_type: 'reservation' }))
    expect(cta.kind).toBe('reservation')
    expect(cta.label).toBe('Reserve a Spot')
    expect(cta.href).toBe('#reserve')
  })

  it('returns null kind when there is no actionable CTA', () => {
    const cta = getHeroCta(makeEvent())
    expect(cta.kind).toBeNull()
    expect(cta.label).toBe('')
  })
})
