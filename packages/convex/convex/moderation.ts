import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { insertModerationLog, requireAdmin, withAdminName } from './helpers'

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const logs = await ctx.db.query('moderationLogs').order('desc').take(100)
    return await withAdminName(ctx, logs)
  },
})

export const logModerationAction = mutation({
  args: {
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      note: args.note ?? undefined,
    })
  },
})

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = args.limit ?? 20
    const logs = await ctx.db.query('moderationLogs').order('desc').take(limit)
    return await withAdminName(ctx, logs)
  },
})

export const getByTarget = query({
  args: { targetType: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const logs = await ctx.db
      .query('moderationLogs')
      .withIndex('by_target', (q) =>
        q.eq('targetType', args.targetType).eq('targetId', args.targetId),
      )
      .order('desc')
      .take(100)
    return await withAdminName(ctx, logs)
  },
})
