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

    const name = args.name.trim()
    if (name.length === 0 || name.length > 200) {
      throw new Error('Name must be between 1 and 200 characters')
    }

    const email = args.email.trim()
    if (email.length === 0 || email.length > 254) {
      throw new Error('Email must be between 1 and 254 characters')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format')
    }

    const message = args.message.trim()
    if (message.length === 0 || message.length > 5000) {
      throw new Error('Message must be between 1 and 5000 characters')
    }

    return await ctx.db.insert('contactSubmissions', {
      name,
      email,
      message,
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
