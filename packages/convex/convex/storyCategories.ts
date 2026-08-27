import { v } from 'convex/values'
import { query, mutation, MutationCtx, QueryCtx } from './_generated/server'
import { Id } from './_generated/dataModel'
import { requireUser } from './helpers'

const MAX_NAME_LENGTH = 40

async function assertOwnCategory(
  ctx: QueryCtx | MutationCtx,
  categoryId: Id<'storyCategories'>,
  userId: Id<'profiles'>,
) {
  const category = await ctx.db.get('storyCategories', categoryId)
  if (!category) throw new Error('Category not found')
  if (category.userId !== userId) throw new Error('Not authorized')
  return category
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const profile = await requireUser(ctx)
    return await ctx.db
      .query('storyCategories')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .order('asc')
      .take(200)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const name = args.name.trim()
    if (!name || name.length > MAX_NAME_LENGTH) {
      throw new Error(`Category name must be 1 to ${MAX_NAME_LENGTH} characters`)
    }
    if (args.color && !/^#[0-9a-fA-F]{3,8}$/.test(args.color)) {
      throw new Error('Invalid color')
    }
    const existing = await ctx.db
      .query('storyCategories')
      .withIndex('by_userId_and_name', (q) => q.eq('userId', profile._id).eq('name', name))
      .first()
    if (existing) throw new Error('Category already exists')
    const count = await ctx.db
      .query('storyCategories')
      .withIndex('by_user', (q) => q.eq('userId', profile._id))
      .take(200)
    return await ctx.db.insert('storyCategories', {
      userId: profile._id,
      name,
      color: args.color,
      icon: args.icon,
      sortOrder: count.length,
    })
  },
})

export const rename = mutation({
  args: { categoryId: v.id('storyCategories'), name: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const category = await assertOwnCategory(ctx, args.categoryId, profile._id)
    const name = args.name.trim()
    if (!name || name.length > MAX_NAME_LENGTH) {
      throw new Error(`Category name must be 1 to ${MAX_NAME_LENGTH} characters`)
    }
    const existing = await ctx.db
      .query('storyCategories')
      .withIndex('by_userId_and_name', (q) => q.eq('userId', profile._id).eq('name', name))
      .first()
    if (existing && existing._id !== category._id) throw new Error('Category already exists')
    await ctx.db.patch('storyCategories', category._id, { name })
  },
})

export const setColor = mutation({
  args: { categoryId: v.id('storyCategories'), color: v.string() },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const category = await assertOwnCategory(ctx, args.categoryId, profile._id)
    if (!/^#[0-9a-fA-F]{3,8}$/.test(args.color)) throw new Error('Invalid color')
    await ctx.db.patch('storyCategories', category._id, { color: args.color })
  },
})

export const remove = mutation({
  args: { categoryId: v.id('storyCategories') },
  handler: async (ctx, args) => {
    const profile = await requireUser(ctx)
    const category = await assertOwnCategory(ctx, args.categoryId, profile._id)
    // Un-categorize stories in this category before deleting it.
    const stories = await ctx.db
      .query('stories')
      .withIndex('by_userId_and_categoryId', (q) =>
        q.eq('userId', profile._id).eq('categoryId', category._id),
      )
      .take(500)
    for (const story of stories) {
      await ctx.db.patch('stories', story._id, { categoryId: undefined })
    }
    await ctx.db.delete('storyCategories', category._id)
  },
})
