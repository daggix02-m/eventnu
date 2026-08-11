import { v } from 'convex/values'
import { query, mutation } from '../_generated/server'
import { requireAdmin } from '../helpers'
import { rateLimiter } from '../rateLimiter'

export const getContactSubmissions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('contactSubmissions').order('desc').take(200)
  },
})

export const submitContact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'submitContact', { key: 'global', throws: true })
    return await ctx.db.insert('contactSubmissions', {
      name: args.name,
      email: args.email,
      message: args.message,
      isResolved: false,
    })
  },
})

export const markContactResolved = mutation({
  args: { submissionId: v.id('contactSubmissions'), resolved: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.patch('contactSubmissions', args.submissionId, {
      isResolved: args.resolved,
    })
  },
})
