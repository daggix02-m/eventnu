import { describe, expect, it } from 'vitest'
import { Doc } from './_generated/dataModel'
import { mapHostToVenueOrganizer } from './migrations'

function makeHost(overrides: Partial<Doc<'hosts'>> = {}): Doc<'hosts'> {
  return {
    _id: 'hosts_test' as Doc<'hosts'>['_id'],
    _creationTime: 1,
    name: 'Velvet Rooftop',
    slug: 'velvet-rooftop',
    hostType: 'bar',
    description: 'A rooftop bar in Bole',
    locationText: 'Bole Atlas',
    status: 'active',
    followerCount: 12,
    verified: true,
    ...overrides,
  }
}

describe('mapHostToVenueOrganizer', () => {
  it('maps every preserved field and sets venue kind + admin management', () => {
    const result = mapHostToVenueOrganizer(makeHost())
    expect(result).toEqual({
      organizerName: 'Velvet Rooftop',
      organizerHandle: 'velvet-rooftop',
      bio: 'A rooftop bar in Bole',
      logoUrl: undefined,
      website: undefined,
      contactEmail: undefined,
      managementMode: 'admin_managed',
      kind: 'venue',
      locationText: 'Bole Atlas',
      status: 'active',
      legacyHostId: 'hosts_test',
      followerCount: 12,
      verified: true,
    })
  })

  it('drops hostType and contactPhone', () => {
    const result = mapHostToVenueOrganizer(
      makeHost({ hostType: 'bar', contactPhone: '+251 9…' }),
    ) as Record<string, unknown>
    expect('hostType' in result).toBe(false)
    expect('contactPhone' in result).toBe(false)
  })

  it('maps empty description to undefined bio', () => {
    const result = mapHostToVenueOrganizer(makeHost({ description: '' }))
    expect(result.bio).toBeUndefined()
  })

  it('carries optional contact and media fields', () => {
    const result = mapHostToVenueOrganizer(
      makeHost({
        contactEmail: 'bookings@velvet.et',
        website: 'https://velvet.et',
        logoUrl: 'https://img/logo.jpg',
      }),
    )
    expect(result).toMatchObject({
      contactEmail: 'bookings@velvet.et',
      website: 'https://velvet.et',
      logoUrl: 'https://img/logo.jpg',
    })
  })
})
