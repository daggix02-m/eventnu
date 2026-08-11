import { v } from 'convex/values'
import { query, mutation } from '../_generated/server'
import { patchDefined, requireAdmin } from '../helpers'

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
    const updates = patchDefined(fields)
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
