import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { getUserProfile, requireAdmin } from './helpers'
import { rateLimiter } from './rateLimiter'

export const getPublishedPages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('pages')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .take(100)
  },
})

export const getPageBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('pages')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    return page ?? null
  },
})

export const getPages = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('pages').order('asc').take(100)
  },
})

export const getPageById = query({
  args: { pageId: v.id('pages') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.get('pages', args.pageId)
  },
})

export const createPage = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    body: v.any(),
    bodyHtml: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('pages', {
      slug: args.slug,
      title: args.title,
      subtitle: args.subtitle ?? undefined,
      body: args.body,
      bodyHtml: args.bodyHtml ?? undefined,
      heroImageUrl: args.heroImageUrl ?? undefined,
      isPublished: args.isPublished ?? false,
      sortOrder: args.sortOrder ?? 0,
    })
  },
})

export const updatePage = mutation({
  args: {
    pageId: v.id('pages'),
    slug: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    body: v.optional(v.any()),
    bodyHtml: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { pageId, ...fields } = args
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch('pages', pageId, updates)
  },
})

export const deletePage = mutation({
  args: { pageId: v.id('pages') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete('pages', args.pageId)
  },
})

export const getActiveAnnouncements = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const profile = await getUserProfile(ctx)
    const profileId = profile?._id ?? null
    const announcements = await ctx.db
      .query('announcements')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(50)
    return announcements.filter(
      (a) =>
        (a.targetUserId === undefined || a.targetUserId === profileId) &&
        (a.startsAt === undefined || a.startsAt <= args.now) &&
        (a.endsAt === undefined || a.endsAt >= args.now),
    )
  },
})

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await ctx.db.query('announcements').order('desc').take(100)
  },
})

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db.insert('announcements', {
      title: args.title,
      message: args.message ?? undefined,
      linkUrl: args.linkUrl ?? undefined,
      linkText: args.linkText ?? undefined,
      isActive: args.isActive ?? false,
      startsAt: args.startsAt ?? undefined,
      endsAt: args.endsAt ?? undefined,
      targetUserId: args.targetUserId ?? undefined,
    })
  },
})

export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id('announcements'),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    linkText: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    targetUserId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const { announcementId, ...fields } = args
    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value
    }
    await ctx.db.patch('announcements', announcementId, updates)
  },
})

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id('announcements') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete('announcements', args.announcementId)
  },
})

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
