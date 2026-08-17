import { getAuthUserId } from '@convex-dev/auth/server'
import { MutationCtx, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

export async function getUserProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'> | null> {
  const userId = await getAuthUserId(ctx)
  if (!userId) return null
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_auth_user', (q) => q.eq('authUserId', userId))
    .first()
  return profile ?? null
}

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const profile = await getUserProfile(ctx)
  if (!profile) throw new Error('Not authenticated')
  if (profile.suspended) throw new Error('Account suspended')
  return profile
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>> {
  const profile = await requireUser(ctx)
  if (profile.role !== 'admin') throw new Error('Admin access required')
  return profile
}

/**
 * Resolve the signed-in organizer and confirm they own a self-managed
 * (`organizer_managed`) organizer profile. Admin-managed profiles are edited
 * only by the Event Nu team, never by the linked account.
 */
export async function requireOrganizerOwner(
  ctx: QueryCtx | MutationCtx,
): Promise<{ profile: Doc<'profiles'>; organizer: Doc<'organizerProfiles'> }> {
  const profile = await requireUser(ctx)
  if (profile.role !== 'organizer') throw new Error('Organizer access required')
  const organizer = await ctx.db
    .query('organizerProfiles')
    .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
    .first()
  if (!organizer) throw new Error('Organizer profile not found')
  if (organizer.managementMode !== 'organizer_managed') {
    throw new Error('This organizer profile is managed by the Event Nu team')
  }
  return { profile, organizer }
}

/** Build a partial patch containing only the defined fields of `fields`. */
export function patchDefined<T extends object>(fields: T): Partial<T> {
  const updates: Partial<T> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) (updates as Record<string, unknown>)[key] = value
  }
  return updates
}

/** Normalize arbitrary text into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Slug with a short random suffix so collisions are unlikely. */
export function uniqueSlug(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).substring(2, 7)}`
}

/** Escape HTML-significant characters so user content can't break out of a template. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type EventImageInput = { url: string; storageId?: string | null; filter?: string | null }

/** Insert event images in order, replacing any existing ones and cleaning up orphaned storage. */
export async function replaceEventImages(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  images: EventImageInput[],
): Promise<void> {
  const existing = await ctx.db
    .query('eventImages')
    .withIndex('by_eventId_and_sortOrder', (q) => q.eq('eventId', eventId))
    .take(100)
  const keepStorageIds = new Set(
    images.map((img) => img.storageId).filter((id): id is string => Boolean(id)),
  )
  for (const img of existing) {
    await ctx.db.delete('eventImages', img._id)
    if (img.storageId && !keepStorageIds.has(img.storageId)) {
      await ctx.storage.delete(img.storageId)
    }
  }
  await insertEventImages(ctx, eventId, images)
}

/** Append event images in order. */
export async function insertEventImages(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  images: EventImageInput[],
): Promise<void> {
  for (const [i, img] of images.entries()) {
    await ctx.db.insert('eventImages', {
      eventId,
      storageId: img.storageId ?? undefined,
      url: img.url,
      filter: img.filter ?? undefined,
      sortOrder: i,
    })
  }
}

/** Insert a notification row. */
export async function insertNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<'profiles'>
    type: string
    title: string
    body: string
    data?: unknown
  },
): Promise<Id<'notifications'>> {
  return await ctx.db.insert('notifications', {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    data: args.data ?? undefined,
    read: false,
  })
}

/** Insert a moderation log row. */
export async function insertModerationLog(
  ctx: MutationCtx,
  args: {
    adminId: Id<'profiles'>
    action: string
    targetType: string
    targetId: string
    note?: string | null
  },
): Promise<Id<'moderationLogs'>> {
  return await ctx.db.insert('moderationLogs', {
    adminId: args.adminId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    note: args.note ?? undefined,
  })
}

/**
 * Bump (or seed) a profile's incrementally-maintained engagement counter. Must
 * be called in the SAME mutation that writes the underlying engagement row so
 * the two can never drift.
 */
export async function incrementEngagementCounter(
  ctx: MutationCtx,
  profileId: Id<'profiles'>,
  field: 'likes' | 'comments' | 'bookmarks' | 'shares' | 'posts',
  delta: 1 | -1,
): Promise<void> {
  const existing = await ctx.db
    .query('engagementCounters')
    .withIndex('by_profile', (q) => q.eq('profileId', profileId))
    .first()
  if (existing) {
    const next = Math.max(0, existing[field] + delta)
    await ctx.db.patch('engagementCounters', existing._id, {
      [field]: next,
    } as Partial<Doc<'engagementCounters'>>)
  } else {
    await ctx.db.insert('engagementCounters', {
      profileId,
      likes: field === 'likes' ? Math.max(0, delta) : 0,
      comments: field === 'comments' ? Math.max(0, delta) : 0,
      bookmarks: field === 'bookmarks' ? Math.max(0, delta) : 0,
      shares: field === 'shares' ? Math.max(0, delta) : 0,
      posts: field === 'posts' ? Math.max(0, delta) : 0,
    })
  }
}

/** Resolve admin full names for moderation log rows. */
export async function withAdminName<T extends { adminId: Id<'profiles'> }>(
  ctx: QueryCtx | MutationCtx,
  logs: T[],
): Promise<(T & { adminName: string })[]> {
  return await Promise.all(
    logs.map(async (log) => {
      const admin = await ctx.db.get('profiles', log.adminId)
      return { ...log, adminName: admin?.fullName ?? 'Unknown' }
    }),
  )
}
