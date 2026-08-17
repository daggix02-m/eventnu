import { describe, expect, it } from 'vitest'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import {
  mapAdminUser,
  mapAnnouncement,
  mapCategory,
  mapContactSubmission,
  mapEvent,
  mapEventCategory,
  mapFeaturedSection,
  mapModerationLog,
  mapNotification,
  mapOrganizer,
  mapPage,
  mapProfile,
  mapReport,
  mapReportTargetPreview,
  mapSupportTicket,
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
    featuredUntil: null,
  } as unknown as Doc<'events'>

  it('maps core fields and defaults', () => {
    const m = mapEvent(e)
    expect(m.id).toBe('evt1')
    expect(m.title).toBe('Sauti Sol')
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

  it('discriminates organizers (former hosts)', () => {
    const h = {
      organizerName: 'Venue',
      status: 'active',
      _id: 'x',
    } as unknown as Doc<'organizerProfiles'>
    expect(mapReportTargetPreview(h)).toEqual({
      target_type: 'organizer',
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

describe('mapAdminUser', () => {
  const row = {
    authUserId: 'auth1',
    email: 'abebe@example.com',
    name: null,
    image: null,
    profileId: 'prof1',
    role: 'admin',
    fullName: 'Abebe Beyene',
    avatarUrl: null,
    suspended: false,
    hasProfile: true,
    created_at: T0,
  }

  it('maps the row with profile fallbacks', () => {
    const m = mapAdminUser(row)
    expect(m).toMatchObject({
      id: 'auth1',
      authUserId: 'auth1',
      profileId: 'prof1',
      username: 'abebe',
      full_name: 'Abebe Beyene',
      email: 'abebe@example.com',
      avatar_url: undefined,
      role: 'admin',
      suspended: false,
      has_profile: true,
      created_at: new Date(T0).toISOString(),
      updated_at: new Date(T0).toISOString(),
    })
  })

  it('falls back to name and no avatar when profile fields are missing', () => {
    const m = mapAdminUser({
      ...row,
      fullName: null,
      name: 'Fallback',
      avatarUrl: null,
      hasProfile: false,
    })
    expect(m.full_name).toBe('Fallback')
    expect(m.avatar_url).toBeUndefined()
    expect(m.has_profile).toBe(false)
  })
})

describe('mapEventCategory', () => {
  it('flags the first category as primary', () => {
    const c = {
      _id: 'c1',
      name: 'Music',
      slug: 'music',
      icon: 'music',
    } as unknown as Doc<'categories'>
    expect(mapEventCategory(c, 0)).toMatchObject({
      category_id: 'c1',
      is_primary: true,
      name: 'Music',
      slug: 'music',
      icon: 'music',
    })
    expect(mapEventCategory(c, 1).is_primary).toBe(false)
    expect(mapEventCategory(null)).toMatchObject({ category_id: '', is_primary: true, name: '' })
  })
})

describe('mapOrganizer', () => {
  it('maps fields and embeds the profile when present', () => {
    const o = {
      _id: 'o1',
      _creationTime: T0,
      profileId: 'p1',
      organizerName: 'Org',
      bio: 'b',
      logoUrl: 'l',
      website: 'w',
      contactEmail: 'e',
      socialLinks: [{ platform: 'instagram', url: 'https://ig/x' }],
      followerCount: 2,
      verified: true,
      organizerHandle: 'org',
    } as unknown as Doc<'organizerProfiles'>
    const profile = { _id: 'p1', email: 'a@b.com' } as unknown as Doc<'profiles'>

    const m = mapOrganizer(o, profile)
    expect(m).toMatchObject({
      profile_id: 'p1',
      organizer_name: 'Org',
      bio: 'b',
      logo_url: 'l',
      website: 'w',
      contact_email: 'e',
      follower_count: 2,
      verified: true,
      organizer_handle: 'org',
    })
    expect(m.profiles).toHaveLength(1)
    expect(m.profiles[0]).toMatchObject({ id: 'p1', username: 'a' })
    expect(mapOrganizer(null).profiles).toEqual([])
  })
})

describe('mapPage', () => {
  it('maps fields and defaults for null', () => {
    const p = {
      _id: 'pg1',
      slug: 'about',
      title: 'About',
      subtitle: 's',
      bodyHtml: '<p>x</p>',
      heroImageUrl: 'https://img/h.png',
      isPublished: true,
      sortOrder: 3,
      _creationTime: T0,
    } as unknown as Doc<'pages'>

    expect(mapPage(p)).toMatchObject({
      id: 'pg1',
      slug: 'about',
      title: 'About',
      subtitle: 's',
      body_html: '<p>x</p>',
      hero_image_url: 'https://img/h.png',
      is_published: true,
      sort_order: 3,
      created_at: new Date(T0).toISOString(),
    })
    expect(mapPage(null)).toMatchObject({
      id: '',
      slug: '',
      title: '',
      subtitle: null,
      is_published: false,
      sort_order: 0,
    })
  })
})

describe('mapAnnouncement', () => {
  it('maps fields and defaults for null', () => {
    const a = {
      _id: 'a1',
      title: 'T',
      message: 'M',
      linkUrl: 'https://link',
      linkText: 'L',
      isActive: true,
      startsAt: T0,
      endsAt: T0 + 1,
      targetUserId: 'u1',
      _creationTime: T0,
    } as unknown as Doc<'announcements'>

    expect(mapAnnouncement(a)).toMatchObject({
      id: 'a1',
      title: 'T',
      message: 'M',
      link_url: 'https://link',
      link_text: 'L',
      is_active: true,
      starts_at: T0,
      ends_at: T0 + 1,
      target_user_id: 'u1',
    })
    expect(mapAnnouncement(null)).toMatchObject({
      id: '',
      title: '',
      message: null,
      is_active: false,
    })
  })
})

describe('mapContactSubmission', () => {
  it('maps fields and defaults for null', () => {
    const s = {
      _id: 's1',
      name: 'N',
      email: 'e@x.com',
      message: 'M',
      isResolved: true,
      _creationTime: T0,
    } as unknown as Doc<'contactSubmissions'>

    expect(mapContactSubmission(s)).toMatchObject({
      id: 's1',
      name: 'N',
      email: 'e@x.com',
      message: 'M',
      is_resolved: true,
    })
    expect(mapContactSubmission(null)).toMatchObject({
      id: '',
      name: '',
      email: '',
      message: '',
      is_resolved: false,
    })
  })
})

describe('mapReport', () => {
  it('maps fields and embeds the reporter profile', () => {
    const r = {
      _id: 'r1',
      _creationTime: T0,
      targetType: 'event',
      targetId: 'evt1',
      reason: 'spam',
      status: 'pending',
      adminNote: 'n',
      reporter: { _id: 'p1', email: 'a@b.com' },
    } as unknown as Doc<'reports'> & { reporter?: Doc<'profiles'> | null }

    expect(mapReport(r)).toMatchObject({
      id: 'r1',
      profiles: { id: 'p1', username: 'a' },
      target_type: 'event',
      target_id: 'evt1',
      reason: 'spam',
      status: 'pending',
      admin_note: 'n',
    })
    expect(mapReport({ ...r, reporter: null }).profiles).toBeNull()
    expect(mapReport(null)).toMatchObject({ id: '', target_type: '', status: 'pending' })
  })
})

describe('mapNotification', () => {
  it('maps fields and embeds the profile when present', () => {
    const n = {
      _id: 'n1',
      userId: 'u1',
      type: 'event',
      title: 'T',
      body: 'B',
      read: false,
      _creationTime: T0,
    } as unknown as Doc<'notifications'>
    const profile = { _id: 'p1', email: 'a@b.com', fullName: 'A' } as unknown as Doc<'profiles'>

    expect(mapNotification(n, profile)).toMatchObject({
      id: 'n1',
      user_id: 'u1',
      type: 'event',
      title: 'T',
      body: 'B',
      read: false,
      profiles: [{ id: 'p1', username: 'a', full_name: 'A' }],
    })
    expect(mapNotification(n).profiles).toBeUndefined()
    expect(mapNotification(null)).toMatchObject({ id: '', user_id: '', type: '' })
  })
})

describe('mapFeaturedSection', () => {
  it('maps fields and defaults for null', () => {
    const s = {
      _id: 'f1',
      label: 'L',
      description: 'D',
      enabled: true,
      sortOrder: 1,
    } as unknown as Doc<'featuredSections'>

    expect(mapFeaturedSection(s)).toMatchObject({
      id: 'f1',
      label: 'L',
      description: 'D',
      enabled: true,
      sort_order: 1,
    })
    expect(mapFeaturedSection(null)).toMatchObject({
      id: '',
      label: '',
      description: '',
      enabled: false,
      sort_order: 0,
    })
  })
})

describe('mapSupportTicket', () => {
  it('maps fields and defaults for null', () => {
    const t = {
      _id: 't1',
      adminId: 'a1',
      subject: 'S',
      message: 'M',
      priority: 'high',
      status: 'open',
      _creationTime: T0,
    } as unknown as Doc<'supportTickets'>

    expect(mapSupportTicket(t)).toMatchObject({
      id: 't1',
      admin_id: 'a1',
      subject: 'S',
      message: 'M',
      priority: 'high',
      status: 'open',
      created_at: new Date(T0).toISOString(),
      updated_at: new Date(T0).toISOString(),
    })
    expect(mapSupportTicket(null)).toMatchObject({
      id: '',
      admin_id: '',
      subject: '',
      message: '',
      priority: '',
      status: '',
    })
  })
})

describe('mapModerationLog', () => {
  it('maps fields and falls back to a generic admin name', () => {
    const l = {
      _id: 'l1',
      _creationTime: T0,
      adminName: 'Abebe',
      action: 'ban',
      targetType: 'user',
      targetId: 'u1',
      note: 'n',
    } as unknown as Doc<'moderationLogs'> & { adminName?: string }

    expect(mapModerationLog(l)).toMatchObject({
      id: 'l1',
      profiles: { full_name: 'Abebe' },
      action: 'ban',
      target_type: 'user',
      target_id: 'u1',
      note: 'n',
    })
    expect(mapModerationLog(null)).toMatchObject({
      id: '',
      profiles: { full_name: 'Admin' },
      action: '',
    })
  })
})
