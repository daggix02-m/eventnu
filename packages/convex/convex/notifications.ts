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

    // Text search must scan the full table, so run it through the search
    // index and return it as a single (bounded, relevance-ranked) page. The
    // no-search path paginates the filtered query with type/read pushed into
    // the predicate so filters apply to the paginated set.
    if (q) {
      const results = await ctx.db
        .query('notifications')
        .withSearchIndex('search_title', (ix) => ix.search('title', q))
        .take(100)
      const userIds = [...new Set(results.map((n) => n.userId))]
      const profiles = await Promise.all(userIds.map((userId) => ctx.db.get('profiles', userId)))
      const profileMap = new Map(
        profiles.filter((p): p is Doc<'profiles'> => p !== null).map((p) => [p._id, p]),
      )
      return {
        page: results.map((n) => ({ ...n, profile: profileMap.get(n.userId) ?? null })),
        isDone: true,
        continueCursor: null,
      }
    }

    const page = await ctx.db
      .query('notifications')
      .order('desc')
      .filter((f) =>
        f.and(
          ...(args.type && args.type !== 'all' ? [f.eq(f.field('type'), args.type)] : []),
          ...(args.read !== undefined ? [f.eq(f.field('read'), args.read)] : []),
        ),
      )
      .paginate(args.paginationOpts)

    const rows = page.page
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
