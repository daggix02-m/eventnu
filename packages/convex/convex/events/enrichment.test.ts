import { describe, expect, it, vi } from 'vitest'
import { Doc } from '../_generated/dataModel'
import {
  enrichPublicEvents,
  resolveImageUrls,
  toPublicEvent,
  toPublicOrganizer,
} from './enrichment'

function makeEventDoc(): Doc<'events'> {
  return {
    _id: 'events_test' as Doc<'events'>['_id'],
    _creationTime: 1,
    title: 'Sauti Sol Live',
    slug: 'sauti-sol-live',
    description: 'A night of Afro-pop',
    subtitle: 'Live in Addis',
    startDate: 2,
    endDate: 3,
    posterUrl: 'https://img.example/poster.jpg',
    imageAspectRatio: '1.5',
    instaPostId: 'IG123',
    instaPermalink: 'https://instagram.com/p/IG123',
    teaserVideoUrl: 'https://v.example/teaser.mp4',
    videoAspectRatio: '16:9',
    externalLink: 'https://ticket.example',
    externalLinkLabel: 'Get tickets',
    priceDisplay: '500 ETB',
    contactEmail: 'org@example.com',
    isFree: false,
    actionType: 'reservation',
    status: 'published',
    source: 'admin',
    ownerId: 'organizerProfiles_test' as Doc<'organizerProfiles'>['_id'],
    isStandalone: false,
    isFeatured: true,
    featuredSection: 'home',
    featuredUntil: 9,
    frequencyType: 'once',
    reservationEnabled: true,
    reservationLimit: 50,
    likeCount: 7,
    bookmarkCount: 2,
    reservationCount: 11,
    timezone: 'Africa/Addis_Ababa',
    venueName: 'Sheraton Addis',
    venueAddress: 'Taitu St',
    venueMapLink: 'https://maps.example',
    venueLat: 9.01,
    venueLng: 38.76,
    adminNote: 'Priority partner — waive fees',
  }
}

function makeProfileDoc(): Doc<'profiles'> {
  return {
    _id: 'profiles_test' as Doc<'profiles'>['_id'],
    _creationTime: 5,
    authUserId: 'users_test' as Doc<'users'>['_id'],
    role: 'user',
    verified: false,
    followerCount: 0,
    fullName: 'Sara Bekele',
    avatarUrl: 'https://img.example/avatar.jpg',
    email: 'sara@example.com',
    suspended: false,
    acceptedTermsAt: 4,
    acceptedTermsVersion: '1.0',
  }
}

function makeOrganizerDoc(
  overrides: Partial<Doc<'organizerProfiles'>> = {},
): Doc<'organizerProfiles'> {
  return {
    _id: 'organizerProfiles_test' as Doc<'organizerProfiles'>['_id'],
    _creationTime: 5,
    profileId: 'profiles_test' as Doc<'profiles'>['_id'],
    organizerName: 'Addis Nights',
    organizerHandle: 'addis-nights',
    bio: 'A rooftop venue in Bole',
    logoUrl: 'https://img.example/logo.jpg',
    website: 'https://addis.example',
    contactEmail: 'hello@addis.example',
    managementMode: 'organizer_managed',
    kind: 'organizer',
    followerCount: 12,
    verified: true,
    ...overrides,
  }
}

describe('toPublicEvent', () => {
  const event = makeEventDoc()
  const images = [
    {
      _id: 'eventImages_a' as Doc<'eventImages'>['_id'],
      _creationTime: 6,
      eventId: event._id,
      storageId: 'storage_a',
      url: 'https://img.example/resolved.jpg',
      sortOrder: 0,
    },
  ]
  const categories: Array<Doc<'categories'>> = []
  const organizer = toPublicOrganizer(makeOrganizerDoc())

  it('strips internal and admin-only fields', () => {
    const result = toPublicEvent(event, categories, images, organizer)
    for (const field of [
      'adminNote',
      'featuredUntil',
      'featuredSection',
      'contactEmail',
      'instaPostId',
      'bookmarkCount',
      'isStandalone',
    ]) {
      expect(field in result).toBe(false)
    }
  })

  it('keeps the fields the public site consumes', () => {
    const result = toPublicEvent(event, categories, images, organizer)
    expect(result).toMatchObject({
      title: event.title,
      slug: event.slug,
      description: event.description,
      instaPermalink: event.instaPermalink,
      reservationEnabled: true,
      reservationLimit: 50,
      reservationCount: 11,
      isFeatured: true,
      likeCount: 7,
      source: 'admin',
      venueName: event.venueName,
      ownerId: 'organizerProfiles_test',
    })
  })

  it('uses the resolved first image url as posterUrl', () => {
    const result = toPublicEvent(event, categories, images, organizer)
    expect(result.posterUrl).toBe('https://img.example/resolved.jpg')
  })

  it('exposes the first category as primaryCategoryId', () => {
    const cats = [
      { _id: 'categories_primary' as Doc<'categories'>['_id'], name: 'Concerts' },
      { _id: 'categories_secondary' as Doc<'categories'>['_id'], name: 'Arts' },
    ] as Array<Doc<'categories'>>
    const result = toPublicEvent(event, cats, images, organizer)
    expect(result.primaryCategoryId).toBe('categories_primary')
  })

  it('leaves primaryCategoryId unset when there are no categories', () => {
    const result = toPublicEvent(event, [], images, organizer)
    expect(result.primaryCategoryId).toBeUndefined()
  })

  it('falls back to the stored posterUrl when there are no images', () => {
    const result = toPublicEvent(event, categories, [], organizer)
    expect(result.posterUrl).toBe(event.posterUrl)
  })
})

describe('toPublicOrganizer', () => {
  it('returns null for a missing organizer', () => {
    expect(toPublicOrganizer(null)).toBeNull()
  })

  it('exposes business identity from the organizer entity', () => {
    const result = toPublicOrganizer(makeOrganizerDoc())
    expect(result).toMatchObject({
      _id: 'organizerProfiles_test',
      fullName: 'Addis Nights',
      handle: 'addis-nights',
      logoUrl: 'https://img.example/logo.jpg',
      bio: 'A rooftop venue in Bole',
      verified: true,
      followerCount: 12,
    })
  })

  it('falls back to the linked profile avatar', () => {
    const result = toPublicOrganizer(makeOrganizerDoc(), makeProfileDoc())
    expect(result?.avatarUrl).toBe('https://img.example/avatar.jpg')
  })

  it('does not expose account or management internals', () => {
    const result = toPublicOrganizer(makeOrganizerDoc(), makeProfileDoc()) as Record<
      string,
      unknown
    >
    for (const field of [
      'email',
      'authUserId',
      'role',
      'suspended',
      'managementMode',
      'profileId',
      'contactEmail',
    ]) {
      expect(field in result).toBe(false)
    }
  })
})

function makeImageDoc(overrides: Partial<Doc<'eventImages'>> = {}): Doc<'eventImages'> {
  return {
    _id: 'eventImages_a' as Doc<'eventImages'>['_id'],
    _creationTime: 6,
    eventId: 'events_test' as Doc<'events'>['_id'],
    storageId: 'storage_a',
    url: 'https://img.example/resolved.jpg',
    sortOrder: 0,
    ...overrides,
  }
}

describe('resolveImageUrls', () => {
  it('uses the persisted url without hitting storage', async () => {
    const getUrl = vi.fn()
    const ctx = { storage: { getUrl } } as unknown as Parameters<typeof resolveImageUrls>[0]
    const images = [makeImageDoc({ url: 'https://img.example/persisted.jpg' })]

    const result = await resolveImageUrls(ctx, images)

    expect(result[0].url).toBe('https://img.example/persisted.jpg')
    expect(getUrl).not.toHaveBeenCalled()
  })

  it('does not call storage.getUrl for images without a storageId', async () => {
    const getUrl = vi.fn()
    const ctx = { storage: { getUrl } } as unknown as Parameters<typeof resolveImageUrls>[0]
    const images = [makeImageDoc({ storageId: undefined })]

    await resolveImageUrls(ctx, images)

    expect(getUrl).not.toHaveBeenCalled()
  })

  it('falls back to storage.getUrl when the persisted url is empty', async () => {
    const getUrl = vi.fn().mockResolvedValue('https://img.example/signed.jpg')
    const ctx = { storage: { getUrl } } as unknown as Parameters<typeof resolveImageUrls>[0]
    const images = [makeImageDoc({ url: '' })]

    const result = await resolveImageUrls(ctx, images)

    expect(getUrl).toHaveBeenCalledWith('storage_a')
    expect(result[0].url).toBe('https://img.example/signed.jpg')
  })

  it('keeps the persisted url when storage.getUrl returns null', async () => {
    const getUrl = vi.fn().mockResolvedValue(null)
    const ctx = { storage: { getUrl } } as unknown as Parameters<typeof resolveImageUrls>[0]
    const images = [makeImageDoc({ url: 'https://img.example/persisted.jpg' })]
    const result = await resolveImageUrls(ctx, images)

    expect(getUrl).not.toHaveBeenCalled()
    expect(result[0].url).toBe('https://img.example/persisted.jpg')
  })
})

type TableRows = Record<string, Array<Record<string, unknown>>>

function makeDb(rows: TableRows) {
  const get = vi.fn(
    (table: keyof TableRows, id: string) => (rows[table] ?? []).find((r) => r._id === id) ?? null,
  )
  const query = vi.fn((table: keyof TableRows) => {
    const tableRows = (rows[table] ?? []) as Array<Record<string, unknown>>
    return {
      withIndex: (
        _name: string,
        predicate: (q: { eq: (f: string, v: unknown) => unknown }) => unknown,
      ) => {
        const eqs: Array<[string, unknown]> = []
        predicate({
          eq: (field: string, value: unknown) => {
            eqs.push([field, value])
            return {}
          },
        })
        const filtered = tableRows.filter((row) =>
          eqs.every(([field, value]) => row[field] === value),
        )
        return {
          take: vi.fn(() => filtered),
          first: vi.fn(() => filtered[0] ?? null),
        }
      },
    }
  })
  const db = { get, query }
  return { db, get, query }
}

describe('enrichPublicEvents', () => {
  const category = { _id: 'categories_a', name: 'Concerts' } as Doc<'categories'>
  const sharedCategory = { _id: 'categories_shared', name: 'Afro-pop' } as Doc<'categories'>
  const eventA = makeEventDoc()
  const eventB = {
    ...makeEventDoc(),
    _id: 'events_b' as Doc<'events'>['_id'],
    title: 'Ephrem Live',
  }

  it('resolves categories and images for every event', async () => {
    const { db } = makeDb({
      categories: [category, sharedCategory],
      eventCategories: [
        { _id: 'ec_a', eventId: eventA._id, categoryId: category._id, isPrimary: true },
        { _id: 'ec_b', eventId: eventB._id, categoryId: sharedCategory._id, isPrimary: false },
      ],
      eventImages: [],
    })
    const ctx = { db, storage: { getUrl: vi.fn() } } as unknown as Parameters<
      typeof enrichPublicEvents
    >[0]

    const result = await enrichPublicEvents(ctx, [eventA, eventB])

    expect(result).toHaveLength(2)
    expect(result[0].categories.map((c) => c._id)).toEqual([category._id])
    expect(result[1].categories.map((c) => c._id)).toEqual([sharedCategory._id])
    expect(result.every((e) => Array.isArray(e.images))).toBe(true)
  })

  it('fetches a shared category only once across the batch', async () => {
    const { db } = makeDb({
      categories: [category, sharedCategory],
      eventCategories: [
        { _id: 'ec_a', eventId: eventA._id, categoryId: sharedCategory._id, isPrimary: true },
        { _id: 'ec_b', eventId: eventB._id, categoryId: sharedCategory._id, isPrimary: true },
      ],
      eventImages: [],
    })
    const ctx = { db, storage: { getUrl: vi.fn() } } as unknown as Parameters<
      typeof enrichPublicEvents
    >[0]

    await enrichPublicEvents(ctx, [eventA, eventB])

    const categoryGets = db.get.mock.calls.filter(([table]) => table === 'categories')
    expect(categoryGets).toHaveLength(1)
    expect(categoryGets[0][1]).toBe(sharedCategory._id)
  })

  it('enriches organizer identity from the owner organizerProfiles', async () => {
    const { db } = makeDb({
      categories: [],
      eventCategories: [],
      eventImages: [],
      organizerProfiles: [makeOrganizerDoc()],
      profiles: [makeProfileDoc()],
    })
    const ctx = { db, storage: { getUrl: vi.fn() } } as unknown as Parameters<
      typeof enrichPublicEvents
    >[0]

    const result = await enrichPublicEvents(ctx, [eventA])

    expect(result[0].organizer).toMatchObject({
      _id: 'organizerProfiles_test',
      fullName: 'Addis Nights',
      handle: 'addis-nights',
      logoUrl: 'https://img.example/logo.jpg',
      verified: true,
    })
  })

  it('returns an empty array when given no events', async () => {
    const { db } = makeDb({ categories: [], eventCategories: [], eventImages: [] })
    const ctx = { db, storage: { getUrl: vi.fn() } } as unknown as Parameters<
      typeof enrichPublicEvents
    >[0]

    await expect(enrichPublicEvents(ctx, [])).resolves.toEqual([])
    expect(db.get).not.toHaveBeenCalled()
  })
})
