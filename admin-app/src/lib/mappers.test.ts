import { describe, expect, it } from 'vitest'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import {
  mapCategory,
  mapEvent,
  mapProfile,
  mapReportTargetPreview,
  mapTopEvent,
  usernameFromEmail,
} from './mappers'

const T0 = Date.UTC(2024, 0, 2, 3, 4, 5)

describe('usernameFromEmail', () => {
  it('uses the local part of the email', () => {
    expect(usernameFromEmail('dagim.smith@example.com')).toBe('dagim.smith')
    expect(usernameFromEmail('Abebe_Beyene@example.com')).toBe('Abebe_Beyene')
  })

  it('falls back for missing or unusable emails', () => {
    expect(usernameFromEmail(null)).toBe('user')
    expect(usernameFromEmail(undefined)).toBe('user')
    expect(usernameFromEmail('')).toBe('user')
    expect(usernameFromEmail('@example.com')).toBe('user')
    expect(usernameFromEmail('???@example.com')).toBe('user')
  })
})

describe('mapProfile', () => {
  it('maps fields and falls back for null', () => {
    const p = {
      _id: 'p1',
      _creationTime: T0,
      email: 'a@b.com',
      fullName: 'Abebe',
      avatarUrl: 'https://img/x.png',
      suspended: false,
      authUserId: 'auth',
      role: 'user',
    } as unknown as Doc<'profiles'>

    expect(mapProfile(p)).toEqual({
      id: 'p1',
      username: 'a',
      full_name: 'Abebe',
      email: 'a@b.com',
      avatar_url: 'https://img/x.png',
      suspended: false,
      created_at: new Date(T0).toISOString(),
      updated_at: new Date(T0).toISOString(),
    })
  })

  it('returns empty defaults for null input', () => {
    expect(mapProfile(null)).toMatchObject({
      id: '',
      username: 'user',
      full_name: '',
      email: '',
      suspended: false,
    })
  })
})

describe('mapEvent', () => {
  const e = {
    _id: 'evt1',
    _creationTime: T0,
    title: 'Sauti Sol',
    startDate: T0,
    endDate: T0 + 3600_000,
    categoryIds: ['c1'],
    organizerId: 'org1',
    featuredUntil: null,
  } as unknown as Doc<'events'>

  it('maps core fields and defaults', () => {
    const m = mapEvent(e)
    expect(m.id).toBe('evt1')
    expect(m.title).toBe('Sauti Sol')
    expect(m.categoryIds).toEqual(['c1'])
    expect(m.organizer_id).toBe('org1')
    expect(m.is_free).toBe(false)
    expect(m.action_type).toBe('open_entry')
    expect(m.status).toBe('draft')
    expect(m.frequency_type).toBe('one_time')
    expect(m.timezone).toBe('Africa/Addis_Ababa')
    expect(m.featured_until).toBe(new Date(0).toISOString())
    const d = new Date(T0)
    const pad = (n: number) => String(n).padStart(2, '0')
    expect(m.start_date).toBe(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    )
    expect(m.created_at).toBe(new Date(T0).toISOString())
  })

  it('returns empty defaults for null input', () => {
    expect(mapEvent(null)).toMatchObject({
      id: '',
      title: '',
      is_free: false,
      action_type: 'open_entry',
      status: 'draft',
      like_count: 0,
    })
  })
})

describe('mapCategory', () => {
  it('maps fields and carries the event count', () => {
    const c = {
      _id: 'c1',
      name: 'Music',
      slug: 'music',
      sortOrder: 2,
      parentId: 'c0',
    } as unknown as Doc<'categories'>

    expect(mapCategory(c, 7)).toMatchObject({
      id: 'c1',
      name: 'Music',
      slug: 'music',
      parent_id: 'c0',
      sort_order: 2,
      event_count: 7,
    })
  })

  it('defaults null fields', () => {
    expect(mapCategory(null)).toMatchObject({
      id: '',
      name: '',
      parent_id: null,
      sort_order: 0,
      event_count: 0,
    })
  })
})

describe('mapTopEvent', () => {
  it('iso-formats start date', () => {
    const e = { _id: 'e1', title: 'T', likeCount: 3, startDate: T0 } as unknown as Doc<'events'>
    expect(mapTopEvent(e)).toEqual({
      id: 'e1',
      title: 'T',
      like_count: 3,
      start_date: new Date(T0).toISOString(),
    })
  })
})

describe('mapReportTargetPreview', () => {
  it('returns null for null input', () => {
    expect(mapReportTargetPreview(null)).toBeNull()
  })

  it('discriminates comments', () => {
    const c = { content: 'offensive', _id: 'x' } as unknown as Doc<'eventComments'>
    expect(mapReportTargetPreview(c)).toEqual({ target_type: 'comment', content: 'offensive' })
  })

  it('discriminates events', () => {
    const e = {
      title: 'Party',
      status: 'published',
      posterUrl: 'https://img/p.png',
      _id: 'x',
    } as unknown as Doc<'events'>
    expect(mapReportTargetPreview(e)).toEqual({
      target_type: 'event',
      title: 'Party',
      status: 'published',
      poster_url: 'https://img/p.png',
    })
  })

  it('discriminates hosts', () => {
    const h = { name: 'Venue', status: 'active', _id: 'x' } as unknown as Doc<'hosts'>
    expect(mapReportTargetPreview(h)).toEqual({
      target_type: 'host',
      name: 'Venue',
      status: 'active',
    })
  })

  it('discriminates users (profiles)', () => {
    const p = {
      fullName: 'Abebe',
      email: 'abebe@example.com',
      avatarUrl: undefined,
      _id: 'x',
    } as unknown as Doc<'profiles'>
    expect(mapReportTargetPreview(p)).toEqual({
      target_type: 'user',
      full_name: 'Abebe',
      username: 'abebe',
      avatar_url: undefined,
    })
  })
})
