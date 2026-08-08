'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapCategory } from '../mappers'

export async function getCategories() {
  try {
    const categories = await fetchQuery(api.categories.getWithEventCounts)
    return categories.map((c) => mapCategory(c, c.eventCount))
  } catch (err) {
    console.error('Failed to load categories:', err)
    throw err
  }
}

export async function createCategory(
  category: { name: string; slug: string; parent_id?: string | null; icon?: string | null; sort_order?: number }
) {
  const result = await fetchMutation(api.categories.create, {
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id as Id<'categories'> ?? undefined,
    icon: category.icon ?? undefined,
    sortOrder: category.sort_order ?? 0,
  })
  revalidatePath('/categories')
  return { id: result }
}

export async function updateCategory(
  categoryId: string,
  updates: { name?: string; slug?: string; parent_id?: string | null; icon?: string | null; sort_order?: number }
) {
  await fetchMutation(api.categories.update, {
    categoryId: categoryId as Id<'categories'>,
    name: updates.name,
    slug: updates.slug,
    parentId: updates.parent_id as Id<'categories'> ?? undefined,
    icon: updates.icon ?? undefined,
    sortOrder: updates.sort_order,
  })
  revalidatePath('/categories')
}

export async function deleteCategory(categoryId: string) {
  await fetchMutation(api.categories.remove, { categoryId: categoryId as Id<'categories'> })
  revalidatePath('/categories')
}

export async function reorderCategories(
  updates: { id: string; sort_order: number }[]
) {
  await fetchMutation(api.categories.reorder, {
    categoryIds: updates.map((u) => u.id as Id<'categories'>),
    startOrder: Math.min(...updates.map((u) => u.sort_order)),
  })
  revalidatePath('/categories')
}
