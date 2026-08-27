import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

vi.mock('./helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./helpers')>()
  return {
    ...actual,
    requireUser: vi.fn(),
    requireAdmin: vi.fn(),
    getUserProfile: vi.fn(),
  }
})

const { publish, remove, markViewed, countViews, expireStories, setCategory, listRail } =
  await import('./stories')
const { requireUser, getUserProfile } = await import('./helpers')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const publishHandler = (publish as unknown as { _handler: Handler })._handler
const removeHandler = (remove as unknown as { _handler: Handler })._handler
const markViewedHandler = (markViewed as unknown as { _handler: Handler })._handler
const countViewsHandler = (countViews as unknown as { _handler: Handler })._handler
const expireHandler = (expireStories as unknown as { _handler: Handler })._handler
const setCategoryHandler = (setCategory as unknown as { _handler: Handler })._handler
const listRailHandler = (listRail as unknown as { _handler: Handler })._handler

const ME = { _id: 'profiles_me', role: 'user', suspended: false }
const ADMIN = { _id: 'profiles_admin', role: 'admin', suspended: false }

function makeDb(opts: {
  storageMeta?: { contentType?: string } | null
  view?: Record<string, unknown> | null
  story?: Record<string, unknown> | null
  docs?: Record<string, Record<string, unknown> | null>
  expiredRows?: Record<string, unknown>[]
  views?: Record<string, unknown>[]
}) {
  const insert = vi.fn(async (_table: string, _doc: Record<string, unknown>) => 'stories_new')
  const patch = vi.fn(async () => undefined)
  const removeFn = vi.fn(async () => undefined)
  const systemGet = vi.fn(async () => opts.storageMeta ?? null)
  const get = vi.fn(async (table: string) => opts.docs?.[table] ?? opts.story ?? null)
  const query = vi.fn(() => ({
    withIndex: (name: string, pred?: (q: Record<string, unknown>) => unknown) => {
      void pred
      return {
        first: vi.fn(async () => (name === 'by_storyId_and_viewerId' ? (opts.view ?? null) : null)),
        take: vi.fn(async () =>
          name === 'by_expiresAt' ? (opts.expiredRows ?? []) : (opts.views ?? []),
        ),
      }
    },
  }))
  const db = { insert, patch, delete: removeFn, get, query, system: { get: systemGet } }
  const storageDelete = vi.fn(async () => undefined)
  const storage = {
    getUrl: vi.fn(async () => 'https://cdn.example/story.jpg'),
    delete: storageDelete,
  }
  return {
    ctx: { db, storage } as unknown as Record<string, unknown>,
    insert,
    patch,
    removeFn,
    systemGet,
    storageDelete,
  }
}

describe('stories.publish', () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
  })

  it('throws when not authenticated', async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new Error('Not authenticated'))
    const { ctx } = makeDb({})
    await expect(publishHandler(ctx, { kind: 'photo', mediaStorageId: 's' })).rejects.toThrow(
      'Not authenticated',
    )
  })

  it('throws when the uploaded file does not exist', async () => {
    const { ctx } = makeDb({ storageMeta: null })
    await expect(publishHandler(ctx, { kind: 'photo', mediaStorageId: 's' })).rejects.toThrow(
      'Uploaded file not found',
    )
  })

  it('rejects a photo storage file with a video content type', async () => {
    const { ctx } = makeDb({ storageMeta: { contentType: 'video/mp4' } })
    await expect(publishHandler(ctx, { kind: 'photo', mediaStorageId: 's' })).rejects.toThrow(
      'must be an image',
    )
  })

  it('rejects a video storage file with an image content type', async () => {
    const { ctx } = makeDb({ storageMeta: { contentType: 'image/jpeg' } })
    await expect(publishHandler(ctx, { kind: 'video', mediaStorageId: 's' })).rejects.toThrow(
      'must be a video',
    )
  })

  it('rejects a caption over the maximum length', async () => {
    const { ctx } = makeDb({ storageMeta: { contentType: 'image/jpeg' } })
    await expect(
      publishHandler(ctx, { kind: 'photo', mediaStorageId: 's', caption: 'a'.repeat(501) }),
    ).rejects.toThrow('Caption must be 500 characters or fewer')
  })

  it('inserts an approved, expiring story for a valid photo upload', async () => {
    const { ctx, insert } = makeDb({ storageMeta: { contentType: 'image/jpeg' } })
    await publishHandler(ctx, { kind: 'photo', mediaStorageId: 's', caption: 'Vibe was unreal' })
    expect(insert).toHaveBeenCalledWith(
      'stories',
      expect.objectContaining({
        userId: 'profiles_me',
        kind: 'photo',
        mediaStorageId: 's',
        moderationStatus: 'approved',
        isDeleted: false,
        caption: 'Vibe was unreal',
        expired: false,
      }),
    )
    const inserted = insert.mock.calls[0][1] as { expiresAt: number; dateKey: string }
    expect(inserted.expiresAt - Date.now()).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(inserted.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('stores the calendar key, location and thumbnail when provided', async () => {
    const { ctx, insert } = makeDb({ storageMeta: { contentType: 'image/jpeg' } })
    await publishHandler(ctx, {
      kind: 'photo',
      mediaStorageId: 's',
      dateKey: '2026-08-27',
      thumbnailStorageId: 'thumb_s',
      latitude: 9.03,
      longitude: 38.74,
      placeName: 'Bole, Addis Ababa',
    })
    expect(insert).toHaveBeenCalledWith(
      'stories',
      expect.objectContaining({
        dateKey: '2026-08-27',
        thumbnailStorageId: 'thumb_s',
        thumbnailUrl: 'https://cdn.example/story.jpg',
        latitude: 9.03,
        longitude: 38.74,
        placeName: 'Bole, Addis Ababa',
      }),
    )
  })

  it('rejects a malformed dateKey', async () => {
    const { ctx } = makeDb({ storageMeta: { contentType: 'image/jpeg' } })
    await expect(
      publishHandler(ctx, { kind: 'photo', mediaStorageId: 's', dateKey: 'not-a-date' }),
    ).rejects.toThrow('dateKey must be YYYY-MM-DD')
  })
})

describe('stories.remove', () => {
  it('lets the owner soft-delete their story', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx, patch } = makeDb({ story: { _id: 'stories_1', userId: 'profiles_me' } })
    await removeHandler(ctx, { storyId: 'stories_1' })
    expect(patch).toHaveBeenCalledWith('stories', 'stories_1', { isDeleted: true })
  })

  it('blocks a non-owner from deleting a story', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx } = makeDb({ story: { _id: 'stories_1', userId: 'profiles_other' } })
    await expect(removeHandler(ctx, { storyId: 'stories_1' })).rejects.toThrow('Not authorized')
  })

  it('throws when the story does not exist', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx } = makeDb({ story: null })
    await expect(removeHandler(ctx, { storyId: 'stories_1' })).rejects.toThrow('Story not found')
  })
})

describe('stories.markViewed', () => {
  it('records a view and returns true when not viewed before', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx, insert } = makeDb({ view: null })
    const result = await markViewedHandler(ctx, { storyId: 'stories_1' })
    expect(result).toBe(true)
    expect(insert).toHaveBeenCalledWith(
      'storyViews',
      expect.objectContaining({ storyId: 'stories_1', viewerId: 'profiles_me' }),
    )
  })

  it('does not duplicate a view for the same viewer', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx, insert } = makeDb({ view: { _id: 'v1', storyId: 'stories_1' } })
    const result = await markViewedHandler(ctx, { storyId: 'stories_1' })
    expect(result).toBe(false)
    expect(insert).not.toHaveBeenCalled()
  })
})

describe('stories.countViews', () => {
  it('returns the view count for the owner', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx } = makeDb({
      story: { _id: 'stories_1', userId: 'profiles_me' },
      views: [{}, {}, {}],
    })
    const result = await countViewsHandler(ctx, { storyId: 'stories_1' })
    expect(result).toBe(3)
  })

  it('throws for a non-owner', async () => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
    const { ctx } = makeDb({ story: { _id: 'stories_1', userId: 'profiles_other' } })
    await expect(countViewsHandler(ctx, { storyId: 'stories_1' })).rejects.toThrow('Not authorized')
  })
})

describe('stories.setCategory', () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
  })

  it('lets the owner assign their own category to a past story', async () => {
    const { ctx, patch } = makeDb({
      story: { _id: 'stories_1', userId: 'profiles_me' },
      docs: { storyCategories: { _id: 'storyCategories_1', userId: 'profiles_me' } },
    })
    await setCategoryHandler(ctx, { storyId: 'stories_1', categoryId: 'storyCategories_1' })
    expect(patch).toHaveBeenCalledWith('stories', 'stories_1', {
      categoryId: 'storyCategories_1',
    })
  })

  it('blocks assigning a category that belongs to another user', async () => {
    const { ctx } = makeDb({
      story: { _id: 'stories_1', userId: 'profiles_me' },
      docs: { storyCategories: { _id: 'storyCategories_1', userId: 'profiles_other' } },
    })
    await expect(
      setCategoryHandler(ctx, { storyId: 'stories_1', categoryId: 'storyCategories_1' }),
    ).rejects.toThrow('Category not found')
  })

  it('blocks a non-owner from categorizing a story', async () => {
    const { ctx } = makeDb({ story: { _id: 'stories_1', userId: 'profiles_other' } })
    await expect(
      setCategoryHandler(ctx, { storyId: 'stories_1', categoryId: 'storyCategories_1' }),
    ).rejects.toThrow('Not authorized')
  })

  it('clears the category when no categoryId is given', async () => {
    const { ctx, patch } = makeDb({ story: { _id: 'stories_1', userId: 'profiles_me' } })
    await setCategoryHandler(ctx, { storyId: 'stories_1' })
    expect(patch).toHaveBeenCalledWith('stories', 'stories_1', { categoryId: undefined })
  })
})

describe('stories.listRail', () => {
  // Rail query chains: stories via by_moderation -> order -> take; storyViews
  // via by_storyId_and_viewerId -> first; authors via db.get('profiles', id).
  function makeRailDb(opts: {
    stories: Array<Record<string, unknown>>
    profiles?: Array<Record<string, unknown>>
    viewedStoryIds?: string[]
  }) {
    const get = vi.fn(async (table: string, id: string) => {
      if (table === 'profiles') return opts.profiles?.find((p) => p._id === id) ?? null
      return null
    })
    const query = vi.fn((table: string) => {
      if (table === 'stories') {
        return {
          withIndex: () => ({
            order: () => ({
              take: vi.fn(async () => opts.stories),
            }),
          }),
        }
      }
      if (table === 'storyViews') {
        return {
          withIndex: () => ({
            first: vi.fn(async () =>
              opts.viewedStoryIds && opts.viewedStoryIds.length > 0 ? { _id: 'sv1' } : null,
            ),
          }),
        }
      }
      throw new Error('unexpected table ' + table)
    })
    return {
      ctx: { db: { get, query } } as unknown as Record<string, unknown>,
      get,
      query,
    }
  }

  const story = ({ _id = '1', ...rest }: Record<string, unknown> = {}) => ({
    userId: 'profiles_a',
    kind: 'photo',
    moderationStatus: 'approved',
    isDeleted: false,
    expiresAt: Date.now() + 100000,
    thumbnailUrl: 'https://cdn.example/a.jpg',
    ...rest,
    _id: `stories_${_id}`,
  })

  beforeEach(() => {
    vi.mocked(getUserProfile).mockResolvedValue(null as never)
  })

  it('returns an empty rail when there are no stories', async () => {
    const { ctx } = makeRailDb({ stories: [] })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as unknown[]
    expect(result).toEqual([])
  })

  it('groups visible stories per author, newest first, with thumbnail + kind', async () => {
    const { ctx } = makeRailDb({
      stories: [
        story({ _id: '1', kind: 'video', thumbnailUrl: null }),
        story({ _id: '2', userId: 'profiles_b', thumbnailUrl: 'https://cdn.example/b.jpg' }),
      ],
      profiles: [
        { _id: 'profiles_a', fullName: 'Author A', avatarUrl: null, username: 'authora' },
        { _id: 'profiles_b', fullName: 'Author B', avatarUrl: 'https://cdn.example/b.png' },
      ],
    })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as Array<{
      authorId: string
      authorName: string
      storyIds: string[]
      latestThumbnailUrl: string | null
      latestKind: 'photo' | 'video'
      hasUnviewed: boolean
    }>
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      authorId: 'profiles_a',
      authorName: 'Author A',
      storyIds: ['stories_1'],
      latestThumbnailUrl: null,
      latestKind: 'video',
    })
    expect(result[1]).toMatchObject({
      authorId: 'profiles_b',
      storyIds: ['stories_2'],
      latestThumbnailUrl: 'https://cdn.example/b.jpg',
      latestKind: 'photo',
    })
  })

  it('excludes deleted and expired stories', async () => {
    const { ctx } = makeRailDb({
      stories: [
        story({ _id: 'deleted', isDeleted: true }),
        story({ _id: 'expired', expiresAt: Date.now() - 1000 }),
        story({ _id: 'live' }),
      ],
      profiles: [{ _id: 'profiles_a', fullName: 'Author A' }],
    })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as Array<{
      storyIds: string[]
    }>
    expect(result).toHaveLength(1)
    expect(result[0].storyIds).toEqual(['stories_live'])
  })

  it('caps stories per author and total authors', async () => {
    const stories: Array<Record<string, unknown>> = []
    for (let i = 0; i < 20; i++) {
      stories.push(story({ _id: `a${i}`, userId: 'profiles_a' }))
    }
    for (let i = 0; i < 16; i++) {
      stories.push(story({ _id: `b${i}`, userId: 'profiles_b' }))
    }
    const { ctx } = makeRailDb({
      stories,
      profiles: [
        { _id: 'profiles_a', fullName: 'Author A' },
        { _id: 'profiles_b', fullName: 'Author B' },
      ],
    })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as Array<{
      authorId: string
      storyIds: string[]
    }>
    expect(result).toHaveLength(2)
    expect(result[0].storyIds).toHaveLength(6)
    expect(result[1].storyIds).toHaveLength(6)
  })

  it('marks an author fully viewed when the viewer has a view row', async () => {
    vi.mocked(getUserProfile).mockResolvedValue({ _id: 'profiles_me' } as never)
    const { ctx } = makeRailDb({
      stories: [story({ _id: '1' })],
      profiles: [{ _id: 'profiles_a', fullName: 'Author A' }],
      viewedStoryIds: ['stories_1'],
    })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as Array<{
      hasUnviewed: boolean
    }>
    expect(result).toHaveLength(1)
    expect(result[0].hasUnviewed).toBe(false)
  })

  it('handles legacy rows missing optional fields without throwing', async () => {
    const { ctx } = makeRailDb({
      stories: [
        {
          _id: 'stories_legacy',
          userId: 'profiles_a',
          moderationStatus: 'approved',
          isDeleted: false,
          expiresAt: Date.now() + 100000,
        },
      ],
      profiles: [{ _id: 'profiles_a', fullName: 'Author A' }],
    })
    const result = (await listRailHandler(ctx, { now: Date.now() })) as Array<{
      latestThumbnailUrl: string | null
      latestKind: 'photo' | 'video'
    }>
    expect(result).toHaveLength(1)
    expect(result[0].latestThumbnailUrl).toBeNull()
    expect(result[0].latestKind).toBe('photo')
  })
})

describe('stories.expireStories', () => {
  it('marks expired stories without deleting their media (owner archive)', async () => {
    const { ctx, patch, removeFn, storageDelete } = makeDb({
      expiredRows: [{ _id: 'stories_old', mediaStorageId: 'storage_old' }],
    })
    await expireHandler(ctx, { now: 1000 })
    expect(patch).toHaveBeenCalledWith('stories', 'stories_old', { expired: true })
    expect(removeFn).not.toHaveBeenCalled()
    expect(storageDelete).not.toHaveBeenCalled()
  })

  it('skips stories already marked expired', async () => {
    const { ctx, patch } = makeDb({
      expiredRows: [{ _id: 'stories_old', mediaStorageId: 'storage_old', expired: true }],
    })
    await expireHandler(ctx, { now: 1000 })
    expect(patch).not.toHaveBeenCalled()
  })
})
