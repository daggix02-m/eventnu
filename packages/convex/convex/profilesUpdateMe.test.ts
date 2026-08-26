import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: vi.fn(async () => 'users_test'),
}))

vi.mock('./rateLimiter', () => ({
  rateLimiter: { limit: vi.fn(async () => undefined) },
}))

vi.mock('./helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./helpers')>()
  return {
    ...actual,
    requireUser: vi.fn(),
  }
})

const { updateMe } = await import('./profiles')
const { requireUser } = await import('./helpers')

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>
const handler = (updateMe as unknown as { _handler: Handler })._handler

const ME = {
  _id: 'profiles_me',
  role: 'user',
  suspended: false,
  fullName: 'Old Name',
  avatarUrl: 'https://old.example/avatar.jpg',
  avatarStorageId: 'storage_old',
  email: 'me@example.com',
}

function makeCtx(opts: {
  me?: Record<string, unknown> | null
  usernameOwner?: Record<string, unknown> | null
  storageUrl?: string | null
}) {
  const patch = vi.fn(async () => undefined)
  const storageDelete = vi.fn(async () => undefined)
  const query = vi.fn(() => ({
    withIndex: () => ({
      first: vi.fn(async () => opts.usernameOwner ?? null),
    }),
  }))
  const db = { patch, query }
  const storage = {
    getUrl: vi.fn(async () => opts.storageUrl ?? null),
    delete: storageDelete,
  }
  return { ctx: { db, storage } as unknown as Record<string, unknown>, patch, storageDelete }
}

describe('profiles.updateMe', () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockResolvedValue(ME as never)
  })

  it('throws when not authenticated', async () => {
    vi.mocked(requireUser).mockRejectedValueOnce(new Error('Not authenticated'))
    const { ctx } = makeCtx({})
    await expect(handler(ctx, {})).rejects.toThrow('Not authenticated')
  })

  it('patches basic profile fields when valid', async () => {
    const { ctx, patch } = makeCtx({})
    await handler(ctx, {
      fullName: '  Addis Star  ',
      bio: 'Nightlife explorer',
      locationText: 'Addis Ababa',
    })
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_me', {
      fullName: 'Addis Star',
      bio: 'Nightlife explorer',
      locationText: 'Addis Ababa',
    })
  })

  it('accepts a valid lowercase username', async () => {
    const { ctx, patch } = makeCtx({})
    await handler(ctx, { username: 'addis_star' })
    expect(patch).toHaveBeenCalledWith(
      'profiles',
      'profiles_me',
      expect.objectContaining({ username: 'addis_star' }),
    )
  })

  it('rejects an invalid username format', async () => {
    const { ctx } = makeCtx({})
    await expect(handler(ctx, { username: 'has space!' })).rejects.toThrow(
      'Username must be 3-30 characters',
    )
  })

  it('rejects an already-taken username owned by another profile', async () => {
    const { ctx } = makeCtx({ usernameOwner: { _id: 'profiles_other', username: 'taken' } })
    await expect(handler(ctx, { username: 'taken' })).rejects.toThrow('Username is already taken')
  })

  it('allows re-saving your own username', async () => {
    const { ctx, patch } = makeCtx({ usernameOwner: { _id: 'profiles_me', username: 'addis' } })
    await handler(ctx, { username: 'addis' })
    expect(patch).toHaveBeenCalledWith(
      'profiles',
      'profiles_me',
      expect.objectContaining({ username: 'addis' }),
    )
  })

  it('rejects an invalid website URL', async () => {
    const { ctx } = makeCtx({})
    await expect(handler(ctx, { website: 'javascript:alert(1)' })).rejects.toThrow(
      'must use http or https',
    )
  })

  it('rejects a bio over the maximum length', async () => {
    const { ctx } = makeCtx({})
    await expect(handler(ctx, { bio: 'a'.repeat(281) })).rejects.toThrow(
      'Bio must be 280 characters or fewer',
    )
  })

  it('rejects an invalid theme preference', async () => {
    const { ctx } = makeCtx({})
    await expect(handler(ctx, { themePreference: 'neon' })).rejects.toThrow(
      'Invalid theme preference',
    )
  })

  it('sets a new avatar from storage and deletes the previous file', async () => {
    const { ctx, patch, storageDelete } = makeCtx({
      storageUrl: 'https://cdn.example/new-avatar.jpg',
    })
    await handler(ctx, { avatarStorageId: 'storage_new' })
    expect(storageDelete).toHaveBeenCalledWith('storage_old')
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_me', {
      avatarUrl: 'https://cdn.example/new-avatar.jpg',
      avatarStorageId: 'storage_new',
    })
  })

  it('does not delete or re-resolve when re-uploading the same file', async () => {
    const { ctx, patch, storageDelete } = makeCtx({})
    await handler(ctx, { avatarStorageId: 'storage_old' })
    expect(storageDelete).not.toHaveBeenCalled()
    expect(patch).toHaveBeenCalledWith('profiles', 'profiles_me', {})
  })

  it('throws when a supplied storage id has no resolvable URL', async () => {
    const { ctx } = makeCtx({ storageUrl: null })
    await expect(handler(ctx, { avatarStorageId: 'storage_missing' })).rejects.toThrow(
      'Uploaded file not found',
    )
  })
})
