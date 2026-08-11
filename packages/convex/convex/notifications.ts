import { v } from 'convex/values'
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { insertNotification, requireAdmin, requireUser } from './helpers'
import { paginationOptsValidator } from 'convex/server'

async function resolveTargetUserId(
  ctx: QueryCtx | MutationCtx,
  requestedUserId: Id<'profiles'>,
): Promise<Id<'profiles'>> {
  const profile = await requireUser(ctx)
  if (profile.role === 'admin') return requestedUserId
  if (requestedUserId !== profile._id) throw new Error('Not authorized')
  return profile._id
}

export const list = query({
  args: { userId: v.id('profiles') },
  handler: async (ctx, args) => {
    const userId = await resolveTargetUserId(ctx, args.userId)
    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(100)
  },
})

export const listAll = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    type: v.optional(v.string()),
    read: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const q = args.search?.toLowerCase()
    const page = await ctx.db.query('notifications').order('desc').paginate(args.paginationOpts)

    let rows = page.page
    if (args.type && args.type !== 'all') {
      rows = rows.filter((n) => n.type === args.type)
    }
    if (args.read !== undefined) {
      rows = rows.filter((n) => n.read === args.read)
    }
    if (q) {
      rows = rows.filter(
        (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
      )
    }

    const userIds = [...new Set(rows.map((n) => n.userId))]
    const profiles = await Promise.all(userIds.map((userId) => ctx.db.get('profiles', userId)))
    const profileMap = new Map(
      profiles.filter((p): p is Doc<'profiles'> => p !== null).map((p) => [p._id, p]),
    )
    return {
      ...page,
      page: rows.map((n) => ({
        ...n,
        profile: profileMap.get(n.userId) ?? null,
      })),
    }
  },
})

export const getUnreadCount = query({
  args: { userId: v.id('profiles') },
  handler: async (ctx, args) => {
    const userId = await resolveTargetUserId(ctx, args.userId)
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_userId_and_read', (q) => q.eq('userId', userId).eq('read', false))
      .take(500)
    return notifications.length
  },
})

export const send = mutation({
  args: {
    userId: v.id('profiles'),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await insertNotification(ctx, args)
  },
})

export const sendBatch = mutation({
  args: {
    userIds: v.array(v.id('profiles')),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    for (const userId of args.userIds) {
      await insertNotification(ctx, {
        userId,
        type: args.type,
        title: args.title,
        body: args.body,
        data: args.data ?? undefined,
      })
    }
  },
})

export const markAllRead = mutation({
  args: { userId: v.id('profiles') },
  handler: async (ctx, args) => {
    const userId = await resolveTargetUserId(ctx, args.userId)
    for await (const n of ctx.db
      .query('notifications')
      .withIndex('by_userId_and_read', (q) => q.eq('userId', userId).eq('read', false))) {
      await ctx.db.patch('notifications', n._id, { read: true })
    }
  },
})
